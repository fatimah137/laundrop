#!/bin/bash

# 🚀 Quick Start: Test Web Push Notifications for Laundrop
# 
# This script helps verify the push notification system is working
# Run: bash test_push_quick_start.sh

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🚀 Web Push Notifications - Quick Start Testing              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_step() {
  echo -e "${BLUE}→${NC} $1"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check if servers are running
echo ""
echo "═══ 1️⃣  Checking Servers ═══"
echo ""

print_step "Checking backend (http://localhost:8000)..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
  print_success "Backend is running ✅"
else
  print_error "Backend is NOT running"
  echo "   Start it with: cd laundrop-api && php artisan serve"
  exit 1
fi

print_step "Checking frontend (http://localhost:5175)..."
if curl -s http://localhost:5175 > /dev/null 2>&1; then
  print_success "Frontend is running ✅"
else
  print_error "Frontend is NOT running"
  echo "   Start it with: cd laundrop-web && npm run dev"
  exit 1
fi

# 2. Check database
echo ""
echo "═══ 2️⃣  Checking Database ═══"
echo ""

print_step "Checking MySQL connection..."
if cd laundrop-api && php -r "require 'vendor/autoload.php'; require 'bootstrap/app.php'; \$db = app('db'); \$db->connection()->getPdo(); echo 'OK';" 2>/dev/null; then
  print_success "MySQL connection OK ✅"
else
  print_error "MySQL connection failed"
  exit 1
fi

# 3. Check VAPID keys
echo ""
echo "═══ 3️⃣  Checking VAPID Configuration ═══"
echo ""

if cd laundrop-api && grep -q "VAPID_PUBLIC_KEY" .env; then
  print_success "VAPID_PUBLIC_KEY found in .env ✅"
else
  print_error "VAPID_PUBLIC_KEY not found in .env"
  echo "   Generate keys with: php generate_vapid_keys.php"
  exit 1
fi

if grep -q "VAPID_PRIVATE_KEY" .env; then
  print_success "VAPID_PRIVATE_KEY found in .env ✅"
else
  print_error "VAPID_PRIVATE_KEY not found in .env"
  exit 1
fi

if grep -q "'vapid'" config/services.php; then
  print_success "VAPID config in services.php ✅"
else
  print_error "VAPID config not in services.php"
  exit 1
fi

# 4. Check frontend files
echo ""
echo "═══ 4️⃣  Checking Frontend Files ═══"
echo ""

cd ../laundrop-web

if [ -f "src/hooks/usePushNotifications.js" ]; then
  print_success "usePushNotifications hook exists ✅"
else
  print_error "usePushNotifications hook missing"
  exit 1
fi

if [ -f "public/sw.js" ]; then
  print_success "Service worker (public/sw.js) exists ✅"
else
  print_error "Service worker missing"
  exit 1
fi

# 5. Manual testing steps
echo ""
echo "═══ 5️⃣  Manual Testing Steps ═══"
echo ""

echo "${YELLOW}STEP 1: Login as Employee${NC}"
echo "  1. Open http://localhost:5175 in your browser"
echo "  2. Click 'Login'"
echo "  3. Use these credentials:"
echo "     Email: employee@laundrop.test"
echo "     Password: password123"
echo ""

echo "${YELLOW}STEP 2: Allow Notification Permission${NC}"
echo "  1. You'll see a popup: 'Allow notifications?'"
echo "  2. Click 'Allow'"
echo "  3. You should be redirected to /employee/dashboard"
echo ""

echo "${YELLOW}STEP 3: Verify Service Worker${NC}"
echo "  1. Open browser DevTools (F12)"
echo "  2. Go to Console tab"
echo "  3. You should see messages like:"
echo "     ✅ Service Worker ready untuk push notifications"
echo "     ✅ Browser subscribed ke push notifications"
echo ""

echo "${YELLOW}STEP 4: Send Test Push Notification${NC}"
echo "  1. Open another terminal window"
echo "  2. Run: cd laundrop-api && php test_push_notification.php"
echo "  3. Watch for confirmation in both console and browser"
echo ""

echo "${YELLOW}STEP 5: Check Browser Notification${NC}"
echo "  1. A notification should pop up in the browser"
echo "  2. It should say '🧪 Test Notification'"
echo "  3. Click it to navigate to notifications page"
echo ""

# 6. Automated test
echo ""
echo "═══ 6️⃣  Quick Automated Check ═══"
echo ""

print_step "Checking if employee exists in database..."
cd ../laundrop-api

EMPLOYEE_COUNT=$(php -r "
require 'bootstrap/app.php';
\$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo App\Models\User::where('role', 'employee')->count();
" 2>/dev/null)

if [ "$EMPLOYEE_COUNT" -gt 0 ]; then
  print_success "Found $EMPLOYEE_COUNT employee(s) ✅"
else
  print_warning "No employees in database. Create one first via admin panel."
fi

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "You're ready to test push notifications. Follow STEP 1-5 above."
echo ""
echo "For detailed documentation, see: ${BLUE}WEB_PUSH_NOTIFICATIONS.md${NC}"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
