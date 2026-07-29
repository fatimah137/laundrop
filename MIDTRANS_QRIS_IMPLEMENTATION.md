# Implementasi QRIS Dynamic via Midtrans

## Konsep
QRIS (Quick Response Code Indonesian Standard) adalah barcode pembayaran yang **berubah setiap transaksi** sesuai nominal order. Berbeda dengan:
- **Static QR**: 1 barcode untuk semua transaksi (tidak cocok untuk e-commerce)
- **Dynamic QR**: Setiap order/transaksi punya barcode unik dengan nominal spesifik ✅

## Arsitektur Solusi

### Flow: Order → QRIS Generate → Payment Confirmation → Status Update
```
1. Customer order dengan total Rp X
2. System generate unique QRIS barcode via Midtrans
3. Customer scan barcode dengan nominal Rp X
4. Payment berhasil
5. Webhook notifikasi → update order status menjadi "paid"
6. Customer melihat status berubah di timeline
```

---

## Setup Midtrans Account

### 1. Get Credentials
- Daftar di https://midtrans.com
- Login ke Dashboard
- **Sandbox Test**: Settings → API Keys (untuk development)
  - **Server Key**: Gunakan di backend
  - **Client Key**: Gunakan di frontend
- **Production**: Aktifkan setelah testing selesai

### 2. Environment Variables
Tambah ke `.env`:
```bash
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=M12345  # Merchant ID dari Midtrans dashboard
```

---

## Backend Implementation

### 1. Update `config/services.php`
```php
'midtrans' => [
    'server_key'    => env('MIDTRANS_SERVER_KEY'),
    'client_key'    => env('MIDTRANS_CLIENT_KEY'),
    'merchant_id'   => env('MIDTRANS_MERCHANT_ID'),
    'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
],
```

### 2. Enhance `MidtransService` untuk Dynamic QRIS

Tambah method baru untuk Core API (dapat QR barcode langsung):

```php
/**
 * Generate dynamic QRIS via Core API
 * Returns barcode string yang bisa ditampilkan di frontend
 */
public function generateDynamicQris(string $orderId, int $amount, string $customerName, string $customerEmail): array
{
    try {
        $params = [
            'payment_type' => 'qris',
            'qris'         => [
                'acquirer' => 'gopay', // atau 'linkaja', 'dana', 'ovo' untuk multi-acquirer
            ],
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $customerName,
                'email'      => $customerEmail,
                'phone'      => '-',
            ],
            'expiry' => [
                'unit'     => 'hours',
                'duration' => 24,
            ],
        ];

        // Call Midtrans Core API
        $response = \Midtrans\CoreApi::charge($params);

        if ($response->status_code == '201' || $response->status_code == '200') {
            return [
                'success'      => true,
                'transaction_id' => $response->transaction_id,
                'qr_string'    => $response->qr_string,      // QR barcode string
                'qr_code_url'  => $response->qr_code_url,    // URL untuk display
                'status'       => $response->transaction_status,
                'gross_amount' => $response->gross_amount,
            ];
        } else {
            return [
                'success' => false,
                'error'   => $response->status_message ?? 'Unknown error',
            ];
        }
    } catch (\Exception $e) {
        Log::error('Midtrans generateDynamicQris error', ['error' => $e->getMessage()]);
        return [
            'success' => false,
            'error'   => $e->getMessage(),
        ];
    }
}

/**
 * Get transaction status dari Midtrans
 */
public function getTransactionStatus(string $orderId): ?array
{
    try {
        $response = \Midtrans\CoreApi::status($orderId);
        
        return [
            'order_id'             => $response->order_id,
            'transaction_id'       => $response->transaction_id,
            'status'               => $response->transaction_status,
            'gross_amount'         => $response->gross_amount,
            'settlement_time'      => $response->settlement_time ?? null,
            'fraud_status'         => $response->fraud_status ?? null,
            'payment_type'         => $response->payment_type ?? null,
        ];
    } catch (\Exception $e) {
        Log::error('Midtrans getTransactionStatus error', ['error' => $e->getMessage()]);
        return null;
    }
}

/**
 * Verifikasi webhook notification dari Midtrans
 */
public function verifyNotification(array $payload): bool
{
    $orderId      = $payload['order_id'];
    $statusCode   = $payload['status_code'];
    $grossAmount  = $payload['gross_amount'];
    $serverKey    = config('services.midtrans.server_key');
    $signatureKey = $payload['signature_key'];

    // Hash formula: order_id + status_code + gross_amount + server_key
    $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

    return $signatureKey === $expectedSignature;
}
```

### 3. Create Payment Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Transaction;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $midtransService;

    public function __construct(MidtransService $midtransService)
    {
        $this->midtransService = $midtransService;
    }

    /**
     * Generate QRIS untuk order spesifik
     * POST /api/orders/{orderId}/generate-qris
     */
    public function generateQris($orderId)
    {
        try {
            $order = Order::findOrFail($orderId);

            // Check if order status valid untuk payment
            if (!in_array($order->status, ['waiting_payment', 'waiting_confirmation'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order status tidak memungkinkan pembayaran',
                ], 422);
            }

            $amount = $order->transaction?->total_amount ?? ($order->estimated_weight * $order->service->price_per_kg);

            if ($amount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nominal pembayaran tidak valid',
                ], 422);
            }

            // Generate QRIS
            $qrisResult = $this->midtransService->generateDynamicQris(
                orderId: $order->order_number,
                amount: (int)$amount,
                customerName: $order->customer->name,
                customerEmail: $order->customer->email
            );

            if (!$qrisResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal generate QRIS: ' . $qrisResult['error'],
                ], 500);
            }

            // Save transaction jika belum ada
            if (!$order->transaction) {
                $order->transaction()->create([
                    'gross_amount'   => $qrisResult['gross_amount'],
                    'total_amount'   => $qrisResult['gross_amount'],
                    'payment_method' => 'qris',
                    'midtrans_transaction_id' => $qrisResult['transaction_id'],
                    'status' => 'pending',
                ]);
            } else {
                $order->transaction->update([
                    'midtrans_transaction_id' => $qrisResult['transaction_id'],
                    'status' => 'pending',
                ]);
            }

            return response()->json([
                'success' => true,
                'data'    => [
                    'order_id'        => $order->id,
                    'order_number'    => $order->order_number,
                    'qr_string'       => $qrisResult['qr_string'],
                    'qr_code_url'     => $qrisResult['qr_code_url'],
                    'transaction_id'  => $qrisResult['transaction_id'],
                    'gross_amount'    => $qrisResult['gross_amount'],
                    'expires_in'      => '24 hours',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('generateQris error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check payment status
     * GET /api/orders/{orderId}/payment-status
     */
    public function checkPaymentStatus($orderId)
    {
        try {
            $order = Order::with('transaction')->findOrFail($orderId);

            if (!$order->transaction?->midtrans_transaction_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'QRIS belum di-generate',
                ], 404);
            }

            // Get status dari Midtrans
            $status = $this->midtransService->getTransactionStatus($order->order_number);

            if (!$status) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal check status ke Midtrans',
                ], 500);
            }

            // Update transaction jika ada perubahan
            if ($status['status'] === 'settlement' || $status['status'] === 'capture') {
                $order->transaction->update([
                    'status' => 'success',
                    'payment_status' => 'paid',
                ]);

                // Update order status ke next step
                if ($order->status === 'waiting_payment') {
                    $order->update(['status' => 'washing']);
                }
            }

            return response()->json([
                'success' => true,
                'data'    => [
                    'transaction_status' => $status['status'],
                    'payment_status'     => $order->transaction->status ?? 'pending',
                    'order_status'       => $order->status,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('checkPaymentStatus error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
            ], 500);
        }
    }

    /**
     * Webhook endpoint untuk Midtrans notification
     * POST /api/webhooks/midtrans
     */
    public function webhookMidtrans(Request $request)
    {
        try {
            $payload = $request->all();

            // Verify signature
            if (!$this->midtransService->verifyNotification($payload)) {
                Log::warning('Midtrans webhook signature invalid', ['payload' => $payload]);
                return response()->json(['status' => 'invalid_signature'], 403);
            }

            $orderId = $payload['order_id'];
            $status  = $payload['transaction_status'];

            // Find order
            $order = Order::where('order_number', $orderId)->firstOrFail();

            // Handle status
            if ($status === 'settlement' || $status === 'capture') {
                // Payment success
                $order->transaction?->update(['status' => 'success', 'payment_status' => 'paid']);
                if ($order->status === 'waiting_payment') {
                    $order->update(['status' => 'washing']);
                }
                Log::info('Payment success via webhook', ['order_id' => $orderId]);
            } elseif ($status === 'cancel' || $status === 'deny') {
                // Payment failed
                $order->transaction?->update(['status' => 'failed']);
                Log::info('Payment failed/cancelled', ['order_id' => $orderId]);
            } elseif ($status === 'pending') {
                // Still waiting
                $order->transaction?->update(['status' => 'pending']);
            }

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            Log::error('Midtrans webhook error', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error'], 500);
        }
    }
}
```

### 4. Add Routes

```php
// routes/api.php
Route::prefix('orders')->group(function () {
    Route::post('{orderId}/generate-qris', [PaymentController::class, 'generateQris']);
    Route::get('{orderId}/payment-status', [PaymentController::class, 'checkPaymentStatus']);
});

// Webhook
Route::post('webhooks/midtrans', [PaymentController::class, 'webhookMidtrans']);
```

### 5. Update Transaction Model (jika belum ada)

```php
$table->string('midtrans_transaction_id')->nullable();
$table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
```

---

## Frontend Implementation

### 1. Payment Modal Component

```jsx
// src/components/Customer/Orders/PaymentQrisModal.jsx
import { useState } from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode.react';
import api from '../../../services/api';

export default function PaymentQrisModal({ order, onClose, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const generateQris = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/orders/${order.id}/generate-qris`);
      setQrData(response.data.data);
      startPaymentPolling(); // Poll setiap 5 detik
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal generate QRIS');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    setCheckingPayment(true);
    try {
      const response = await api.get(`/orders/${order.id}/payment-status`);
      setPaymentStatus(response.data.data.transaction_status);
      
      if (response.data.data.transaction_status === 'settlement' || 
          response.data.data.transaction_status === 'capture') {
        setPaymentStatus('paid');
        setTimeout(() => {
          onPaymentSuccess?.();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Check payment error:', err);
    } finally {
      setCheckingPayment(false);
    }
  };

  const startPaymentPolling = () => {
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Check setiap 5 detik

    return () => clearInterval(interval);
  };

  const copyQrString = () => {
    if (qrData?.qr_string) {
      navigator.clipboard.writeText(qrData.qr_string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>Pembayaran QRIS</h2>
          <p className="modal-subtitle">{order.order_number}</p>
        </div>

        <div className="modal-body">
          {!qrData ? (
            <div className="payment-init">
              <p className="payment-amount">
                Total: <strong>Rp {(order.price || order.estimated_price).toLocaleString('id-ID')}</strong>
              </p>
              <button 
                className="btn-primary"
                onClick={generateQris}
                disabled={loading}
              >
                {loading ? 'Membuat QR Code...' : 'Buat QR Code QRIS'}
              </button>
            </div>
          ) : (
            <div className="payment-qris">
              {paymentStatus === 'paid' ? (
                <div className="payment-success">
                  <CheckCircle size={48} color="green" />
                  <p className="success-title">Pembayaran Berhasil!</p>
                  <p className="success-subtitle">Status order sedang diperbarui...</p>
                </div>
              ) : (
                <>
                  <div className="qr-container">
                    {qrData?.qr_string && (
                      <QRCode 
                        value={qrData.qr_string} 
                        size={200}
                        level="H"
                        includeMargin
                      />
                    )}
                  </div>

                  <div className="payment-instructions">
                    <h3>Instruksi Pembayaran:</h3>
                    <ol>
                      <li>Buka aplikasi e-wallet (GoPay, DANA, OVO, LinkAja)</li>
                      <li>Pilih "Scan QR Code"</li>
                      <li>Arahkan kamera ke QR Code di atas</li>
                      <li>Konfirmasi pembayaran sebesar <strong>Rp {qrData?.gross_amount.toLocaleString('id-ID')}</strong></li>
                      <li>Tunggu konfirmasi sukses</li>
                    </ol>
                  </div>

                  <div className="qr-string-section">
                    <label>Atau copy string QRIS ini:</label>
                    <div className="copy-input">
                      <code>{qrData?.qr_string}</code>
                      <button 
                        className="copy-btn"
                        onClick={copyQrString}
                        title="Copy"
                      >
                        <Copy size={16} />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="payment-status">
                    <p>Status: <strong>{paymentStatus === 'pending' ? 'Menunggu pembayaran...' : 'Lunas ✓'}</strong></p>
                    <button
                      className="btn-secondary"
                      onClick={checkPaymentStatus}
                      disabled={checkingPayment}
                    >
                      {checkingPayment ? 'Checking...' : 'Refresh Status'}
                    </button>
                  </div>

                  <p className="payment-note">
                    Pembayaran akan otomatis terverifikasi dalam beberapa detik setelah transfer.
                    Jangan tutup halaman ini sampai status menjadi "Lunas".
                  </p>
                </>
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
}
```

### 2. Integrasi ke Order Modal

```jsx
// Di OrderModal atau TrackOrderModal, tambah button untuk payment:

{order?.payment_status !== 'paid' && order?.status === 'waiting_payment' && (
  <button 
    onClick={() => setPaymentQrisModal(true)}
    className="btn-primary"
  >
    Bayar dengan QRIS
  </button>
)}

{paymentQrisModal && (
  <PaymentQrisModal
    order={order}
    onClose={() => setPaymentQrisModal(false)}
    onPaymentSuccess={() => {
      // Refresh order data
      fetchOrderDetail();
    }}
  />
)}
```

---

## Midtrans Webhook Configuration

Di Midtrans Dashboard:
1. Settings → Webhook → Set URL:
   ```
   https://yourdomain.com/api/webhooks/midtrans
   ```
2. Enable notifications untuk:
   - `settlement`
   - `capture`
   - `pending`
   - `deny`
   - `cancel`

---

## Testing (Sandbox)

### Simulator Cards/Wallets:
- **GoPay**: Gunakan nomor +62XXXXXXXXXXX
- **DANA**: Virtual account auto-generated
- **OVO**: Email OVO terdaftar
- **LinkAja**: Nomor telepon terdaftar

### Test Flow:
1. Generate QRIS
2. Scan barcode dengan simulator
3. Confirm payment
4. Check webhook notification di Midtrans Dashboard
5. Verify order status berubah ke "washing"

---

## Production Checklist

- [ ] Update environment variables (production keys)
- [ ] Test QRIS generation dengan real account
- [ ] Verify webhook notification bekerja
- [ ] Setup error logging/monitoring
- [ ] Test payment flow end-to-end
- [ ] Setup SSL certificate (HTTPS required)
- [ ] Test refund/cancellation process
- [ ] Setup customer support procedures

---

## Keuntungan Approach Ini

✅ **Dynamic QR**: Barcode berubah per order/nominal
✅ **Multiple Acquirers**: Dukung GoPay, DANA, OVO, LinkAja sekaligus
✅ **Real-time Status**: Webhook auto-update order status
✅ **No User Redirect**: Tetap di app, tidak perlu redirect ke Snap page
✅ **Better UX**: QR Code display di modal, bukan halaman Snap
✅ **Scalable**: Core API lebih flexible daripada Snap

---

## Troubleshooting

### QR Code tidak muncul
- Check server key configuration
- Verify API credentials di Midtrans Dashboard
- Check network/CORS issues

### Payment notification tidak masuk
- Verify webhook URL di Midtrans Dashboard
- Check firewall/security groups
- Test webhook manually dari Midtrans Dashboard

### Order status tidak update
- Verify webhook implementation
- Check database transaction logs
- Verify order status transitions logic
