<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    // ─── POST /api/auth/register ──────────────────────────────────────────────

    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'required|string|max:20',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->numbers()->symbols()],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'password_hash' => Hash::make($request->password),
            'role'          => 'customer',
            'is_active'     => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 'Akun berhasil dibuat', 201);
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password_hash)) {
            return $this->error('Email atau password salah', 401);
        }

        if (! $user->is_active) {
            return $this->error('Akun Anda tidak aktif. Hubungi admin.', 403);
        }

        // Hapus token lama, buat baru
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 'Login berhasil');
    }

    // ─── POST /api/auth/logout ────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logout berhasil');
    }

    // ─── GET /api/auth/me ─────────────────────────────────────────────────────

    public function me(Request $request): JsonResponse
    {
        return $this->success($this->formatUser($request->user()));
    }

    // ─── POST /api/auth/forgot-password ──────────────────────────────────────

    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error('Gagal mengirim email reset password', 500);
        }

        return $this->success(null, 'Link reset password telah dikirim ke email Anda');
    }

    // ─── POST /api/auth/reset-password ───────────────────────────────────────

    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->numbers()->symbols()],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->update(['password_hash' => Hash::make($password)]);
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error('Token tidak valid atau sudah kadaluarsa', 400);
        }

        return $this->success(null, 'Password berhasil direset. Silakan login kembali.');
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function formatUser(User $user): array
    {
        return [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role'  => $user->role,
        ];
    }
}
