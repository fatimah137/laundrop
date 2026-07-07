<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Throwable;
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

        try {
            $status = Password::sendResetLink($request->only('email'));
        } catch (Throwable $e) {
            report($e);

            return $this->error('Gagal mengirim email reset. Periksa konfigurasi SMTP (username/app password Gmail).', 500);
        }

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

    // ─── POST /api/auth/google ───────────────────────────────────────────────────

    public function google(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $googleClientId = config('services.google.client_id');
        if (! $googleClientId) {
            return $this->error('Google client ID belum dikonfigurasi', 500);
        }

        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->id_token,
        ]);

        if (! $response->successful()) {
            return $this->error('Token Google tidak valid', 401);
        }

        $payload = $response->json();

        if (($payload['aud'] ?? '') !== $googleClientId) {
            return $this->error('Token Google tidak cocok dengan aplikasi', 401);
        }

        if (($payload['email_verified'] ?? 'false') !== 'true' && ($payload['email_verified'] ?? false) !== true) {
            return $this->error('Email Google belum terverifikasi', 403);
        }

        $email = $payload['email'];
        $name = $payload['name'] ?? explode('@', $email)[0];

        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = User::create([
                'name'          => $name,
                'email'         => $email,
                'phone'         => null,
                'password_hash' => Hash::make(Str::random(32)),
                'role'          => 'customer',
                'is_active'     => true,
            ]);
        }

        if (! $user->is_active) {
            return $this->error('Akun Anda diblokir', 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 'Login Google berhasil');
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
