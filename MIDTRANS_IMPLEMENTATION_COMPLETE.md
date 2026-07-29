# Midtrans QRIS Dynamic Payment Implementation — Complete

## ✅ Implementation Status

All core components have been successfully implemented and deployed:

### Backend (Laravel API)
- ✅ `config/services.php` — Midtrans configuration with server_key, client_key, merchant_id
- ✅ `app/Services/MidtransService.php` — Three payment methods:
  - `generateDynamicQris()` — Generate QRIS barcode per order nominal
  - `getTransactionStatus()` — Check payment status from Midtrans
  - `verifyNotification()` — Validate webhook signatures for security
- ✅ `app/Http/Controllers/PaymentController.php` — Three new endpoints:
  - `POST /api/orders/{orderId}/generate-qris` — Customer triggers QRIS generation
  - `GET /api/orders/{orderId}/payment-status` — Poll for payment confirmation
  - `POST /api/webhooks/midtrans` — Webhook handler (public, no auth)
- ✅ `routes/api.php` — Routes registered with proper middleware

### Frontend (React)
- ✅ `src/components/Customer/Orders/PaymentQrisModal.jsx` — Complete modal component with:
  - QR code display via qrcode.react library
  - Payment status polling (every 5 seconds)
  - Auto-close and callback on successful payment
  - Fallback error handling and retry logic
- ✅ `src/pages/customer/History/History.jsx` — Integration:
  - Added PaymentQrisModal component instance
  - Handle `onPayQris` callback from TrackOrderModal
  - Refresh order data on payment success
- ✅ `src/components/Customer/Orders/TrackOrderModal.jsx` — Updated:
  - Passes `onPayQris` callback to parent
  - Shows "Bayar QRIS" button when status='waiting_payment'

### Dependencies Installed
- ✅ Backend: `midtrans/midtrans-php` v2.6.2 (Composer)
- ✅ Frontend: `qrcode.react` (npm)

### Environment Configuration
- ✅ `.env` updated with Midtrans sandbox credentials:
  ```
  MIDTRANS_SERVER_KEY=SB-Mid-server-test
  MIDTRANS_CLIENT_KEY=SB-Mid-client-test
  MIDTRANS_MERCHANT_ID=G141532908
  MIDTRANS_IS_PRODUCTION=false
  ```

---

## 🎯 Payment Flow

### Customer View

1. **Order Tracking**
   - Customer opens "Track Order" modal (e.g., Completed order)
   - Status shows "Menunggu Pembayaran"
   - Sees alert: "Pembayaran QRIS Diperlukan"
   - Clicks "Bayar QRIS" button

2. **Payment Modal Opens**
   - `PaymentQrisModal` component displayed
   - Backend calls `POST /api/orders/{id}/generate-qris`
   - Midtrans returns QR barcode string + transaction ID

3. **Display & Scan**
   - QR code rendered on screen via `<QRCode>` component
   - Shows order number, nominal, payment instructions
   - Customer scans with e-wallet app (GoPay, OVO, DANA, LinkAja)

4. **Payment Processing**
   - Frontend polls `GET /api/orders/{id}/payment-status` every 5 seconds
   - Status checked against Midtrans API
   - Two confirmation paths:
     - **Polling**: `checkPaymentStatus()` detects settlement/capture
     - **Webhook**: Midtrans sends real-time notification to `POST /api/webhooks/midtrans`

5. **Payment Success**
   - Modal shows ✓ "Pembayaran Berhasil!"
   - Order status automatically updates: `waiting_payment` → `washing`
   - Customer receives notification
   - Modal closes after 2 seconds

### System Flow

```
Customer clicks "Bayar QRIS"
    ↓
PaymentQrisModal opens
    ↓
API: POST /orders/{id}/generate-qris
    ↓ (Laravel)
MidtransService::generateDynamicQris()
    ↓
Midtrans Core API returns QR barcode
    ↓
Display QR code to customer
    ↓
[Parallel: Polling + Webhook]
    ├─ Polling: GET /payment-status every 5s
    │   └─ Checks Midtrans transaction status
    │
    └─ Webhook: POST /webhooks/midtrans
        └─ Midtrans sends real-time notification
    ↓
Status === 'settlement' || 'capture'
    ↓
Order status: waiting_payment → washing
    ↓
Show success screen
```

---

## 🔐 Security

### Signature Verification
Every webhook from Midtrans is verified using SHA-512 hash:
```php
$expectedSignature = hash('sha512', 
    $orderId . $statusCode . $grossAmount . $serverKey
);
hash_equals($signatureKey, $expectedSignature); // True/False
```

### Authentication
- Customer QRIS endpoints: Protected with `auth:sanctum` middleware
- Webhook endpoint: Public but signature-verified (Midtrans IP + hash)
- Payment polling: Includes order ownership check

---

## 🧪 Testing Guide

### Prerequisites
- PHP server running: `php artisan serve`
- Frontend dev server running: `npm run dev`
- MySQL with laundrop database
- Midtrans sandbox account with test credentials

### Manual Testing

#### 1. **Create Test Order with QRIS Payment**
```bash
# Login as customer
curl -X POST http://localhost:8000/api/auth/login \
  -d "email=customer@laundrop.id&password=customer123" \
  -H "Accept: application/json"

# Get token from response
TOKEN="your_token_here"

# Create order (payment_method must be 'qris')
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "order_type": "pickup",
    "estimated_weight": 5,
    "payment_method": "qris",
    "pickup_address": "Jl. Test No. 1",
    "pickup_date": "2025-01-25",
    "pickup_time": "10:00",
    "notes": "Test order"
  }'

# Note order ID from response
```

#### 2. **Generate QRIS**
```bash
ORDER_ID=123  # Use ID from above

curl -X POST "http://localhost:8000/api/orders/$ORDER_ID/generate-qris" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Response:
# {
#   "success": true,
#   "data": {
#     "qr_string": "00020126360014...",
#     "transaction_id": "...",
#     "gross_amount": 25000,
#     "status": "pending"
#   }
# }
```

#### 3. **Frontend Testing**
1. Login at http://localhost:5173 with `customer@laundrop.id` / `customer123`
2. Go to **History** page
3. Select any **waiting_payment** order
4. Click **"Track Order"** button
5. See alert: "Pembayaran QRIS Diperlukan"
6. Click **"Bayar QRIS"** button
7. Modal opens with QR code
8. See payment instructions

#### 4. **Check Payment Status (Polling)**
```bash
curl -X GET "http://localhost:8000/api/orders/$ORDER_ID/payment-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Response when pending:
# {
#   "transaction_status": "pending",
#   "payment_status": "pending",
#   "order_status": "waiting_payment"
# }

# Response when paid:
# {
#   "transaction_status": "settlement",
#   "payment_status": "success",
#   "order_status": "washing"
# }
```

#### 5. **Webhook Testing (Midtrans → Your App)**

Midtrans will automatically send webhooks to: `http://localhost:8000/api/webhooks/midtrans`

To test manually, get a valid Midtrans webhook payload and send:
```bash
curl -X POST http://localhost:8000/api/webhooks/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "LD-...",
    "status_code": "200",
    "transaction_status": "settlement",
    "gross_amount": "25000",
    "signature_key": "..."
  }'
```

---

## 📊 Database Changes

### Transaction Table Updates
After successful payment:
- `transaction.status` → `'success'`
- `transaction.midtrans_transaction_id` → Transaction ID from Midtrans
- `transaction.total_amount` → Confirmed gross amount

### Order Table Updates
After successful payment:
- `order.status` → `'washing'` (from `'waiting_payment'`)
- `order.updated_at` → Current timestamp

---

## 🚀 Production Deployment

### Before Going Live

1. **Get Production Credentials** from Midtrans dashboard:
   - Server Key (production)
   - Client Key (production)
   - Merchant ID

2. **Update .env**:
   ```env
   MIDTRANS_SERVER_KEY=Mid-server-prod-xxxxx
   MIDTRANS_CLIENT_KEY=Mid-client-prod-xxxxx
   MIDTRANS_MERCHANT_ID=YOUR-MERCHANT-ID
   MIDTRANS_IS_PRODUCTION=true  # ← CHANGE THIS
   ```

3. **Register Webhook URL** in Midtrans Dashboard:
   - Go to Settings → Webhooks
   - Add: `https://yourdomain.com/api/webhooks/midtrans`
   - Enable: Payment Notification & Refund Notification

4. **Test with Midtrans Sandbox First**:
   - Use sandbox credentials
   - Test full payment flow
   - Verify webhooks received
   - Check database updates

5. **SSL/HTTPS Required**:
   - Midtrans production requires HTTPS
   - Configure SSL certificate on your server

6. **Rate Limiting** (Optional):
   - Midtrans suggests rate limiting payment endpoints
   - Add to `routes/api.php`:
   ```php
   Route::middleware('throttle:60,1')->group(function () {
       Route::post('orders/{orderId}/generate-qris', ...);
       Route::get('orders/{orderId}/payment-status', ...);
   });
   ```

---

## 🔧 Troubleshooting

### Issue: "Gagal generate QRIS"
**Cause**: Midtrans SDK not initialized or network error
**Solution**:
- Verify `.env` has correct Midtrans keys
- Check internet connection
- Test with Postman: `POST /api/orders/{id}/generate-qris`
- Check Laravel logs: `storage/logs/laravel.log`

### Issue: "Signature invalid" on webhook
**Cause**: Server key mismatch or wrong signature calculation
**Solution**:
- Verify `MIDTRANS_SERVER_KEY` in `.env`
- Log webhook payload in controller
- Check hash formula: `order_id + status_code + gross_amount + server_key`

### Issue: QR code not rendering
**Cause**: qrcode.react not installed or import error
**Solution**:
```bash
cd laundrop-web
npm install qrcode.react
npm run dev  # Restart dev server
```

### Issue: Payment status polling never updates
**Cause**: Order not found or network latency
**Solution**:
- Check order exists: `GET /api/orders/{id}`
- Verify `transaction.midtrans_transaction_id` exists
- Check browser console for API errors
- Wait 30 seconds (Midtrans may delay status)

### Issue: Order status doesn't update to "washing"
**Cause**: Webhook not received or polling condition not met
**Solution**:
- Check Laravel logs for webhook received
- Verify webhook signature verification passed
- Check transaction.status updated to 'success'
- Manually test: `PATCH /api/orders/{id}/status` with `status=washing`

---

## 📝 API Reference

### POST /api/orders/{orderId}/generate-qris
Generate dynamic QRIS barcode for an order

**Auth**: Required (Customer)
**Response**:
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "order_number": "LD-ABC123",
    "qr_string": "00020126...",
    "transaction_id": "123456789",
    "gross_amount": 25000,
    "status": "pending",
    "expires_in": "24 jam"
  }
}
```

### GET /api/orders/{orderId}/payment-status
Check payment status from Midtrans

**Auth**: Required (Customer)
**Response**:
```json
{
  "success": true,
  "data": {
    "transaction_status": "settlement|pending|cancel|deny",
    "payment_status": "success|pending|failed",
    "order_status": "washing|waiting_payment|...",
    "gross_amount": 25000
  }
}
```

### POST /api/webhooks/midtrans
Receive payment notifications from Midtrans (Webhook)

**Auth**: None (Signature verified)
**Payload** (from Midtrans):
```json
{
  "order_id": "LD-ABC123",
  "status_code": "200",
  "transaction_status": "settlement",
  "gross_amount": "25000",
  "signature_key": "sha512_hash"
}
```

---

## 📚 Files Modified

| File | Changes |
|------|---------|
| `config/services.php` | Added Midtrans configuration block |
| `app/Services/MidtransService.php` | Added 3 new methods for QRIS |
| `app/Http/Controllers/PaymentController.php` | Added 3 new public methods |
| `routes/api.php` | Added 3 new routes |
| `src/components/Customer/Orders/PaymentQrisModal.jsx` | NEW - Complete payment modal |
| `src/pages/customer/History/History.jsx` | Integrated PaymentQrisModal |
| `src/components/Customer/Orders/TrackOrderModal.jsx` | Added `onPayQris` callback |
| `.env` | Added Midtrans credentials |
| `composer.json` | Added midtrans/midtrans-php dependency |
| `package.json` | Added qrcode.react dependency |

---

## ✨ Key Features

✅ **Dynamic Barcode per Order**: Each order gets unique QRIS code based on nominal amount  
✅ **Real-time Payment Detection**: Dual polling + webhook for instant confirmation  
✅ **Auto Status Update**: Order automatically progresses to washing on payment  
✅ **Signature Verification**: Webhook secured with SHA-512 hashing  
✅ **Customer Ownership Check**: Can only pay/view their own orders  
✅ **Graceful Error Handling**: Retry logic and clear error messages  
✅ **Responsive UI**: QR modal works on mobile for e-wallet scanning  
✅ **Sandbox/Production Ready**: Single ENV flag to switch modes  

---

## 🎓 Next Steps

1. **Email Notifications** (Optional):
   - Send payment confirmation email to customer
   - Add to `PaymentController@webhookMidtrans` after status update

2. **Admin Payment Dashboard** (Optional):
   - List pending/successful QRIS payments
   - Manual payment verification for rejected transactions
   - Refund handling

3. **Other Payment Methods** (Future):
   - BCA Bank Transfer
   - GCash (for Philippine market)
   - E-wallet direct (without QRIS)

4. **Analytics** (Future):
   - Track payment success rate
   - Monitor QRIS usage vs other methods
   - Revenue reports by payment method

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete and Ready for Testing  
**Last Updated**: Today
