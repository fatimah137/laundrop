<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    // Lihat list order
    public function viewAny(User $user): bool
    {
        return true; // semua role bisa, difilter di controller
    }

    // Lihat detail 1 order
    public function view(User $user, Order $order): bool
    {
        return match ($user->role) {
            'customer' => $order->customer_id === $user->id,
            'employee' => $order->employee_id === $user->id,
            'owner'    => true,
            default    => false,
        };
    }

    // Buat order baru
    public function create(User $user): bool
    {
        return $user->role === 'customer';
    }

    // Batalkan order
    public function cancel(User $user, Order $order): bool
    {
        return $user->role === 'customer'
            && $order->customer_id === $user->id
            && $order->isCancellable();
    }

    // Update status order
    public function updateStatus(User $user, Order $order): bool
    {
        return in_array($user->role, ['employee', 'owner']);
    }
}