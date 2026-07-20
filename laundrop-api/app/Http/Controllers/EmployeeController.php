<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $query = User::whereIn('role', ['employee', 'owner'])->latest();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min(100, (int) $request->query('per_page', 12)));
        $employees = $query->paginate($perPage);

        $employees->getCollection()->transform(function (User $employee) {
            $employee->setAttribute('total_orders', (int) Order::query()->where('employee_id', $employee->id)->count());
            $employee->setAttribute('recent_orders_count', (int) Order::query()->where('employee_id', $employee->id)->latest()->limit(3)->count());
            return $employee;
        });

        return $this->success($employees);
    }

    public function show(int $id): JsonResponse
    {
        $employee = User::whereIn('role', ['employee', 'owner'])->findOrFail($id);

        $employee->setAttribute('total_orders', (int) Order::query()->where('employee_id', $employee->id)->count());
        $employee->setAttribute('completed_orders', (int) Order::query()
            ->where('employee_id', $employee->id)
            ->where('status', Order::STATUS_COMPLETED)
            ->count());

        $recentOrders = Order::with('service:id,name')
            ->where('employee_id', $employee->id)
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
                ];
            });

        return $this->success([
            'employee' => $employee,
            'recent_orders' => $recentOrders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => ['required', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['employee', 'owner'])],
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $data = $validator->validated();

        $employee = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password']),
            'role' => $data['role'] ?? 'employee',
            'is_active' => $request->boolean('is_active', true),
        ]);

        return $this->success($employee, 'Karyawan berhasil ditambahkan', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $employee = User::whereIn('role', ['employee', 'owner'])->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:150|unique:users,email,' . $employee->id,
            'role' => ['required', Rule::in(['employee', 'owner'])],
            'is_active' => 'sometimes|boolean',
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $payload = [
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'role' => $request->role,
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->filled('password')) {
            $payload['password_hash'] = Hash::make((string) $request->password);
        }

        $employee->update($payload);

        return $this->success($employee, 'Karyawan berhasil diupdate');
    }

    public function destroy(int $id): JsonResponse
    {
        $employee = User::whereIn('role', ['employee', 'owner'])->findOrFail($id);

        if ($employee->role === 'owner') {
            return $this->error('Owner tidak bisa dihapus', 422);
        }

        $employee->delete();

        return $this->success(null, 'Karyawan berhasil dihapus');
    }
}
