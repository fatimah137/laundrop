# 🚀 Web Push Notifications Implementation

## Overview

Sistem push notification sudah diimplementasikan **end-to-end** untuk employee Laundrop. Employee akan menerima browser notification untuk:
- 📦 **Pesanan Masuk** (order_created)
- 🔄 **Perubahan Status** (status_changed)  
- 💳 **Pembayaran Masuk** (payment_success)
- ⏰ **Pengingat** (reminder)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (Laravel)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NotificationService.php                                        │
│  ├─ send() → Create DB record + sendWebPush()                  │
│  └─ sendWebPush() → VAPID encrypted push via Minishlink        │
│                                                                 │
│  PushSubscriptionController.php                                 │
│  ├─ POST /api/push/subscribe   → Register browser subscription │
│  └─ DELETE /api/push/unsubscribe → Unregister subscription     │
│                                                                 │
│  Database: push_subscriptions table                            │
│  ├─ id, user_id, endpoint, p256dh, auth_key                  │
│  └─ Unique constraint: (user_id, endpoint)                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      NETWORK (Web Push Protocol)                │
│  VAPID Keys (Public/Private) → Identify application            │
│  Subscription endpoint → Route to browser                      │
│  Encryption → p256dh + auth_key                                │
├─────────────────────────────────────────────────────────────────┤
│                       FRONTEND (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  hooks/usePushNotifications.js                                  │
│  ├─ requestPermission() → Ask user "Allow notifications?"      │
│  ├─ subscribe() → Get push subscription from service worker    │
│  └─ POST /api/push/subscribe → Register to backend             │
│                                                                 │
│  public/sw.js (Service Worker)                                 │
│  ├─ self.addEventListener('push') → Receive encrypted message │
│  ├─ self.registration.showNotification() → Display popup       │
│  └─ self.addEventListener('notificationclick') → Handle click  │
│                                                                 │
│  pages/dashboard/OwnerDashboard/OwnerDashboard.jsx              │
│  └─ usePushNotifications(userId) → Auto-subscribe on mount    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Status

✅ **Backend (READY)**
- VAPID keys generated dan configured di .env
- config/services.php updated with VAPID section
- NotificationService.sendWebPush() implemented
- PushSubscriptionController ready (POST /api/push/subscribe)
- Database migration for push_subscriptions table exists

✅ **Frontend (READY)**
- usePushNotifications hook created
- Service worker (public/sw.js) with push event handlers
- OwnerDashboard auto-subscribes employee on mount
- Notification permission request dialog ready

## Setup Instructions

### 1. **Verify VAPID Keys** (Already Done ✅)

```php
# laundrop-api/.env
VAPID_PUBLIC_KEY="FNqihYQ15H0CQ2GfI5N0SSTNuChki584eO1qrj57jF6e7eQSP2lKozN7lIKz7DRGPAXkySIG34e-YQDKhs4eslU"
VAPID_PRIVATE_KEY="sXW1VJWBd0jV7Bk0Nb1TdVW4O340opXYebHRVD87DtA"

# laundrop-api/config/services.php
'vapid' => [
    'public_key' => env('VAPID_PUBLIC_KEY'),
    'private_key' => env('VAPID_PRIVATE_KEY'),
],
```

### 2. **Ensure Database Schema** (Already Exists)

```bash
# Check if push_subscriptions table exists
php artisan migrate --path=database/migrations/2026_04_27_034202_create_push_subscriptions_table.php
```

Table structure:
```sql
CREATE TABLE push_subscriptions (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL FOREIGN KEY,
  endpoint VARCHAR(500) NOT NULL,
  p256dh LONGTEXT NOT NULL,
  auth_key LONGTEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (user_id, endpoint)
);
```

### 3. **Clear Browser Cache** (Important!)

Service worker caches are aggressive. Clear before testing:

**Chrome/Edge:**
1. DevTools → Application tab
2. Service Workers → Unregister all
3. Storage → Clear site data
4. Hard refresh (Ctrl+Shift+R)

**Firefox:**
1. about:debugging → This Firefox
2. Service Workers → Unregister
3. Storage → Clear all
4. Hard refresh (Ctrl+F5)

### 4. **Start Development Servers**

```bash
# Backend
cd laundrop-api
php artisan serve  # http://localhost:8000

# Frontend
cd laundrop-web
npm run dev  # http://localhost:5175
```

## Testing Workflow

### **Step 1: Login as Employee**

1. Open http://localhost:5175
2. Click "Login"
3. Use employee credentials (role: 'employee')
4. Redirect to `/employee/dashboard`

### **Step 2: Allow Notification Permission**

1. Browser asks "Allow notifications from laundrop?"
2. Click **Allow**
3. Check browser console:
   ```
   ✅ Service Worker ready untuk push notifications
   ✅ Browser subscribed ke push notifications
   ✅ Subscription registered ke backend
   ```

### **Step 3: Verify Subscription in Database**

```bash
# Check push_subscriptions table
mysql> SELECT * FROM push_subscriptions WHERE user_id = 2;

# Should see:
# ┌────┬─────────┬──────────────────────┬─────────┬──────────┐
# │ id │ user_id │ endpoint             │ p256dh  │ auth_key │
# ├────┼─────────┼──────────────────────┼─────────┼──────────┤
# │ 1  │ 2       │ https://...endpoint  │ ...     │ ...      │
# └────┴─────────┴──────────────────────┴─────────┴──────────┘
```

### **Step 4: Test Push Notification**

**Option A: Using Test Script**

```bash
cd laundrop-api
php test_push_notification.php

# Output:
# ✅ VAPID keys configured
# ✅ Found employee user
# ✅ Found 1 subscription(s)
# 📤 Sending to endpoint...
# ✅ Push notification sent!
```

**Option B: Manual Test (PHP)**

```php
<?php
$notificationService = new \App\Services\NotificationService();
$notificationService->send(
    userId: 2,           // Employee user ID
    orderId: 1,          // Sample order ID
    type: 'order_created',
    title: '🧪 Test Order',
    body: 'Test push notification - pesanan masuk!'
);
?>
```

**Option C: Real Event Trigger**

Create a test order via API:
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "weight": 5,
    "description": "Test clothes"
  }'
```

This triggers `NotificationService.send()` for all employees.

### **Step 5: Check Browser Notification**

When push arrives:
1. **Browser notification popup** appears (in top-right corner)
2. Click to open `/dashboard/notifications`
3. Notification in browser notification center (Windows: bottom-right tray)

## Integration Points

### Automatic Notifications via NotificationService

These events automatically trigger push notifications:

**1. Order Created** (`OrderController.store()`)
```php
$this->notificationService->send(
    userId: $order->employee_id,
    orderId: $order->id,
    type: 'order_created',
    title: 'Pesanan Masuk',
    body: "Pesanan #{$order->order_number} dari {$customer->name}"
);
```

**2. Status Changed** (`OrderController.updateStatus()`)
```php
$this->notificationService->sendStatusUpdate($order, $newStatus);
```

**3. Payment Success** (`PaymentController` after payment confirmation)
```php
$this->notificationService->send(
    userId: $order->employee_id,
    orderId: $order->id,
    type: 'payment_success',
    title: 'Pembayaran Berhasil',
    body: "Pembayaran pesanan #{$order->order_number} diterima"
);
```

## Debugging

### **No Notification Appears?**

Check in order:

```javascript
// 1. Browser console
- Look for "✅ Service Worker ready"
- Look for "✅ Browser subscribed to push"

// 2. Check service worker registration
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW Registered:', regs.length))

// 3. Check notification permission
console.log('Permission:', Notification.permission)

// 4. Check push subscription
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub)
  })
})
```

### **Push Arrives but No Popup?**

- Check if notifications are muted in browser settings
- Check OS notification center settings
- Verify `requireInteraction: true` in service worker
- Check browser DevTools → Application → Manifest notifications

### **Database Subscription Not Appearing?**

```bash
# Check if subscription POST succeeded
# Look in network tab for /api/push/subscribe

# Verify endpoint format is valid URL
SELECT * FROM push_subscriptions WHERE user_id = 2;

# Check if API returned 201 Created
# Check browser console for POST errors
```

### **VAPID Key Errors?**

```
WebPush Error: Invalid VAPID keys
```

Solutions:
1. Verify `.env` has correct keys (no extra spaces/quotes)
2. Regenerate keys:
   ```bash
   php generate_vapid_keys.php
   ```
3. Clear Laravel config cache:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

## Testing Checklist

- [ ] **Step 1**: Employee logs in → Redirects to `/employee/dashboard`
- [ ] **Step 2**: Browser asks "Allow notifications?" → Click Allow
- [ ] **Step 3**: Browser console shows "✅ Service Worker ready"
- [ ] **Step 4**: Console shows "✅ Browser subscribed to push"
- [ ] **Step 5**: Check DB: `push_subscriptions` has entry for employee
- [ ] **Step 6**: Run `php test_push_notification.php`
- [ ] **Step 7**: Test notification popup appears in browser
- [ ] **Step 8**: Click notification → Navigates to `/dashboard/notifications`
- [ ] **Step 9**: Notification entry appears in notification list
- [ ] **Step 10**: Create test order → All employees see push notification

## Performance & Best Practices

### ✅ Do's
- Auto-subscribe on first employee login (already implemented)
- Store subscription in localStorage to avoid re-subscribing
- Handle expired subscriptions gracefully (delete from DB)
- Use `requireInteraction: true` to keep notification until dismissed
- Log all push errors for debugging

### ❌ Don'ts
- Don't spam notifications (throttle or batch)
- Don't send notifications for every minor event
- Don't forget to handle permission denial
- Don't store sensitive data in push message (encrypted anyway)
- Don't forget to cleanup on logout (unsubscribe)

## Monitoring & Logging

All push notification events are logged:

```bash
# View push logs
tail -f laundrop-api/storage/logs/laravel.log | grep "Web Push"

# Expected log patterns:
# [2026-XX-XX] local.INFO: Web Push gagal (user_id: 2, error: ...)
# [2026-XX-XX] local.INFO: Testing push notification send (user_id: 2)
```

## Security Notes

- VAPID keys are generated and stored in `.env` (never commit to git)
- Each browser gets unique subscription endpoint + encryption keys
- Push messages are encrypted at transport layer
- Expired subscriptions auto-deleted from database
- Backend validates user authentication before sending push

## Next Steps (Future)

- [ ] Add push notification toggle in employee settings
- [ ] Implement notification categories (sound, badge, action buttons)
- [ ] Add rich notifications with images/action links
- [ ] Implement silent push for badge updates only
- [ ] Add offline detection to queue notifications
- [ ] Implement notification analytics (sent, delivered, read)
