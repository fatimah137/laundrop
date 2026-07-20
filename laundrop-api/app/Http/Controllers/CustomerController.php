<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $query = User::customers()->latest();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min(100, (int) $request->query('per_page', 12)));
        $customers = $query->paginate($perPage);

        $customers->getCollection()->transform(function (User $customer) {
            $customer->setAttribute('total_orders', (int) Order::query()->where('customer_id', $customer->id)->count());
            $customer->setAttribute('total_spent', (float) Order::query()
                ->where('customer_id', $customer->id)
                ->leftJoin('transactions', 'transactions.order_id', '=', 'orders.id')
                ->sum('transactions.total_amount'));
            return $customer;
        });

        return $this->success($customers);
    }

    public function show(int $id): JsonResponse
    {
        $customer = User::customers()->findOrFail($id);

        $customer->setAttribute('total_orders', (int) Order::query()->where('customer_id', $customer->id)->count());
        $customer->setAttribute('total_spent', (float) Order::query()
            ->where('customer_id', $customer->id)
            ->leftJoin('transactions', 'transactions.order_id', '=', 'orders.id')
            ->sum('transactions.total_amount'));

        $recentOrders = Order::with('service:id,name')
            ->where('customer_id', $customer->id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'service_name' => $order->service?->name,
                    'pickup_date' => optional($order->pickup_date)?->format('Y-m-d'),
                    'status' => $order->status,
                    'total_amount' => (float) optional($order->transaction)->total_amount,
                ];
            });

        return $this->success([
            'customer' => $customer,
            'recent_orders' => $recentOrders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:150|unique:users,email',
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $data = $validator->validated();

        $customer = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password'] ?? 'customer123'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $customer->setAttribute('notes', $data['notes'] ?? null);
        $customer->setAttribute('address', $data['address'] ?? null);

        return $this->success($customer, 'Customer berhasil ditambahkan', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = User::customers()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:150|unique:users,email,' . $customer->id,
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $customer->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'is_active' => $request->boolean('is_active', true),
        ]);

        $customer->setAttribute('address', $request->address);
        $customer->setAttribute('notes', $request->notes);

        return $this->success($customer, 'Customer berhasil diupdate');
    }

    public function destroy(int $id): JsonResponse
    {
        $customer = User::customers()->findOrFail($id);
        $customer->delete();

        return $this->success(null, 'Customer berhasil dihapus');
    }
}
