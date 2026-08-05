# 🔧 Push Notifications Debug - Fix Applied

## What Was Fixed

### Issue 1: Hook State Management ❌→✅
**Problem:** 
- `usePushNotifications` hook was calling `checkNotificationPermission()` at render time
- Result was static 'default' permission state, not reactive
- Auto-subscribe logic never triggered because permission stayed 'default'

**Fix:**
- Added `useState` for `permission` and `isSubscribed`
- Updated state when permission changes
- Hook now returns reactive state instead of calling function directly

### Issue 2: Timing of Permission Request ❌→✅
**Problem:**
- Hook wasn't automatically requesting permission
- Employee had to wait or manually trigger subscription

**Fix:**
- Hook now auto-requests permission on first mount
- Separate useEffect subscribes after permission is granted
- Proper async flow: request → wait for state update → subscribe

### Issue 3: Service Worker Configuration ❌→✅
**Problem:**
- Vite PWA auto-generates service worker with Workbox
- Manual push handlers weren't being used

**Fix:**
- Created custom `src/sw.ts` service worker
- Updated `vite.config.js` to use `injectManifest` strategy
- Service worker now includes push event handlers built-in
- Workbox still handles precaching

## Files Modified

1. **laundrop-web/src/hooks/usePushNotifications.js**
   - Added state management for permission and isSubscribed
   - Auto-request permission on mount
   - Auto-subscribe after permission granted
   - Fixed async flow

2. **laundrop-web/src/pages/dashboard/OwnerDashboard/OwnerDashboard.jsx**
   - Simplified to just call hook (auto-handles subscription)
   - Only triggers for employee role

3. **laundrop-web/vite.config.js**
   - Changed to `strategies: 'injectManifest'`
   - Added `srcDir: 'src'` and `filename: 'sw.ts'`
   - Will use custom service worker

4. **laundrop-web/src/sw.ts** (NEW)
   - Custom service worker with push notification handlers
   - Handles push events and displays notifications
   - Handles notification clicks

## What Happens Now

```
Employee logs in to dashboard
↓
OwnerDashboard mounts
↓
usePushNotifications hook initializes
↓
Hook auto-requests notification permission
↓
Browser shows "Allow notifications?" dialog
↓
Employee clicks "Allow"
↓
Permission state updates in hook
↓
Auto-subscribe logic triggers
↓
Subscription endpoint sent to backend
↓
Browser ready for push notifications ✅
```

## Testing Steps

### 1. Clear Browser Cache (IMPORTANT!)
```
DevTools → Application → Service Workers → Unregister all
Storage → Clear site data
Hard refresh (Ctrl+Shift+R)
```

### 2. Restart Frontend Dev Server
```bash
# Terminal in laundrop-web directory
npm run dev
# Should start on http://localhost:5175
```

### 3. Login as Employee
- URL: http://localhost:5175
- Login with employee credentials

### 4. Allow Notifications
- Browser asks "Allow notifications from Laundrop?"
- Click "Allow"
- Check browser console (F12 → Console tab)

### 5. Expected Console Logs
```
✅ Service Worker ready untuk push notifications
✅ Browser subscribed ke push notifications
✅ Subscription registered ke backend
📬 Subscription endpoint received
```

### 6. Send Test Push
```bash
# Terminal in laundrop-api directory
php test_push_notification.php
```

### 7. Verify Notification
- Browser should show notification popup
- Message: "🧪 Test Notification"
- Click → Navigate to notifications page

## Debugging if Still Not Working

### Check 1: Service Worker Registered
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registered:', regs.length))
```
Should output: `SW registered: 1` or more

### Check 2: Push Subscription Exists
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Push sub:', sub ? 'EXISTS' : 'NONE')
  })
})
```
Should show: `Push sub: EXISTS`

### Check 3: Database Entry
```bash
mysql -u root
> SELECT * FROM push_subscriptions WHERE user_id = 2;
```
Should show at least 1 row with endpoint

### Check 4: Browser Console Errors
- Look for red error messages
- Check for CORS errors
- Check for VAPID key errors

### Check 5: VAPID Keys Configured
```bash
cd laundrop-api
php artisan tinker
>>> config('services.vapid.public_key')
>>> config('services.vapid.private_key')
```
Both should show non-empty strings

## Next Steps

1. **Reload browser** with cache cleared
2. **Check console** for logs
3. **Allow notifications** when prompted
4. **Run test script** to send push
5. **Verify notification** appears

## If Push Still Not Arriving

Common issues:
- ❌ Service worker not registered → Clear cache, hard refresh
- ❌ Permission not granted → Check browser notification settings
- ❌ Subscription not stored → Check database
- ❌ VAPID keys missing → Check .env file
- ❌ Backend not receiving push → Check PHP logs

All infrastructure is now in place. The fix handles the async flow properly.

**Status: ✅ Ready to Test**
