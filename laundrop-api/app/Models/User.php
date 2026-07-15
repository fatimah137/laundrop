<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password_hash',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active'         => 'boolean',
    ];

    // Override default password field
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeCustomers($query)
    {
        return $query->where('role', 'customer');
    }

    public function scopeEmployees($query)
    {
        return $query->where('role', 'employee');
    }

    public function scopeOwners($query)
    {
        return $query->where('role', 'owner');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function ordersAsCustomer()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function ordersAsEmployee()
    {
        return $this->hasMany(Order::class, 'employee_id');
    }

    public function orderStatusLogs()
    {
        return $this->hasMany(OrderStatusLog::class, 'changed_by');
    }

    public function notifications()
    {
        return $this->hasMany(OrderNotification::class, 'user_id');
    }

    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class, 'user_id');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
