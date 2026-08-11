# Fitur Map Picker Lokasi Realtime Customer

## 📍 Deskripsi
Integrasi Geolocation API untuk auto-detect dan auto-populate lokasi customer ke map picker secara realtime pada halaman Order.

## ✨ Fitur Utama

1. **Auto-Detect Lokasi Customer**
   - Secara otomatis mendeteksi lokasi customer saat halaman dimuat
   - Menggunakan Geolocation API browser (dengan permission request)
   - Lokasi disimpan ke localStorage untuk persistensi

2. **Auto-Populate Map**
   - Map picker otomatis berpusat ke lokasi customer
   - Marker awal ditempatkan pada koordinat customer
   - Validasi area service otomatis dilakukan

3. **Real-time Updates**
   - Lokasi customer diupdate setiap 30 detik
   - Perubahan koordinat tersimpan ke localStorage
   - UI responsif terhadap perubahan lokasi

4. **Manual Control**
   - Button "📍 Gunakan Lokasi Saya" untuk manual request lokasi
   - Error handling dengan option untuk coba ulang
   - User dapat drag marker untuk set lokasi manual

## 📁 File yang Ditambah/Diubah

### 1. [laundrop-web/src/hooks/useCustomerLocation.js](laundrop-web/src/hooks/useCustomerLocation.js) (BARU)
Custom React hook untuk manage customer location dengan fitur:
- `location`: { lat, lng } koordinat saat ini atau null
- `loading`: boolean status pencarian lokasi
- `error`: string pesan error atau null
- `requestLocation()`: function manual request lokasi

Fitur internal:
- Auto-request lokasi saat component mount
- Watch position updates setiap 30 detik
- Cache ke localStorage: `last_customer_location`
- Cache permission request status: `location_permission_requested`

### 2. [laundrop-web/src/pages/customer/Order/Order.jsx](laundrop-web/src/pages/customer/Order/Order.jsx)
Perubahan:
- Import hook `useCustomerLocation`
- Tambah import `MapPin` dari lucide-react
- Call hook di component render: `useCustomerLocation()`
- Tambah state: `useCustomerLocationForPickup` untuk track status
- Effect auto-populate pickup location saat customer location ready
- Update `pickupPosition` useMemo untuk fallback ke customerLocation
- UI improvements:
  - Button "📍 Gunakan Lokasi Saya" (conditional render)
  - Status message untuk location loading/error
  - Success message saat lokasi terdeteksi
  - Error handling dengan retry button

## 🔄 Data Flow

```
Customer buka halaman Order
    ↓
useCustomerLocation() auto-request lokasi
    ↓
User accept permission (atau decline)
    ↓
Lokasi diterima → disimpan ke localStorage
    ↓
Effect trigger → auto-populate pickupPosition
    ↓
Map berpusat ke customer location
    ↓
Marker awal di koordinat customer
    ↓
updatePickupFromCoordinates() trigger
    ↓
Reverse geocoding mencari alamat otomatis
    ↓
Form.pickupAddress & Form.pickupLat/Lng populated
    ↓
Validasi area service (dalam/luar Tembalang-Banyumanik)
    ↓
Success → UI show "✅ Lokasi Anda terdeteksi!"
```

## 🎯 Use Cases

### Case 1: Customer pertama kali order (default pickup)
1. Halaman Order dimuat → hook request lokasi
2. User allow → lokasi obtained
3. Map auto-center ke lokasi customer
4. Alamat auto-reverse geocode
5. Customer tinggal confirm atau adjust

### Case 2: Customer switch dari drop_off ke pickup
1. User ubah order type ke pickup
2. Effect trigger → auto-populate dengan customerLocation
3. Proses sama seperti Case 1

### Case 3: Customer deny location permission
1. User deny → error message tampil
2. Button "Coba lagi" tersedia untuk manual request
3. Button "📍 Gunakan Lokasi Saya" hidden
4. User tetap bisa pilih location manual di map

### Case 4: Customer drag marker
1. User drag marker di map
2. updatePickupFromCoordinates() trigger
3. `useCustomerLocationForPickup` flag di-reset
4. New coordinates divalidasi & geocoded

## 🔧 Konfigurasi

### Geolocation Options (dalam useCustomerLocation.js)
```javascript
{
  enableHighAccuracy: true,    // Akurasi tinggi (boros baterai)
  timeout: 10000,              // Timeout 10 detik (request pertama)
  maximumAge: 30000,           // Cache lokasi 30 detik (watch)
}
```

### Watch Position Interval
```javascript
setInterval(() => { ... }, 30000)  // Update setiap 30 detik
```

Bisa diubah sesuai kebutuhan (misal: 15000ms untuk real-time lebih tinggi).

## 📊 Browser Compatibility

✅ Supported:
- Chrome/Edge 50+
- Firefox 3.5+
- Safari 5+
- Android Chrome

❌ Not Supported:
- HTTP (hanya HTTPS yang support)
- Internet Explorer
- Browser old

## 🔒 Privacy & Security

1. **Permission Request**
   - Browser akan auto-request permission saat hook pertama kali run
   - User dapat allow/deny
   - Permission state di-cache, tidak minta berulang kali

2. **Data Handling**
   - Lokasi hanya disimpan ke localStorage (client-side)
   - TIDAK dikirim ke backend otomatis
   - Hanya dikirim saat customer submit order

3. **HTTPS Required**
   - Geolocation API hanya work di HTTPS
   - Localhost HTTP development tetap work

## 🐛 Error Handling

| Error | Pesan | Solusi |
|-------|-------|--------|
| PERMISSION_DENIED | "Lokasi ditolak..." | User manual allow di browser settings |
| POSITION_UNAVAILABLE | "Lokasi tidak tersedia..." | GPS mati atau tidak signal |
| TIMEOUT | "Timeout saat mencari lokasi..." | Refresh halaman |

## 🎨 CSS Classes

Menggunakan existing classes:
- `.btn-pick-saved-address` - Button style
- `.map-area-warning` - Warning message (mod: backgroundColor untuk success)
- `.map-error-box` - Error message
- `.form-hint` - Hint text

## ⚡ Performance

- Hook di-optimize dengan useMemo & useCallback
- Geolocation watch di-cleanup saat component unmount
- localStorage caching untuk persistent state
- Minimal re-render dengan selective dependencies

## 📝 Testing Manual

1. **Test Auto-Detect**
   - Buka halaman Order
   - Izinkan location permission
   - Verifikasi map center ke lokasi Anda
   - Check localStorage: `last_customer_location`

2. **Test Manual Control**
   - Buka Order halaman
   - Deny location permission
   - Click "Coba lagi" button
   - Allow permission → lokasi should appear

3. **Test Fallback**
   - Buka Order halaman
   - Jangan allow location
   - Map harus center ke DEFAULT_MAP_CENTER (laundry coordinate)

4. **Test Watch Position**
   - Allow location
   - Move ke lokasi berbeda (GPS update)
   - Check localStorage setiap 30 detik auto-update

## 🚀 Future Enhancements

1. **Radius Search**
   - Show "Service tidak tersedia di area Anda" lebih cepat
   - Radius-based filtering untuk service area

2. **Multiple Saved Locations**
   - Auto-load last used location
   - Quick access location buttons

3. **Real-time Distance**
   - Show live distance ke laundry saat customer move
   - Dynamic delivery fee update

4. **Location History**
   - Track customer's frequent locations
   - Suggest common pickup spots

## 📞 Support

Jika ada pertanyaan tentang implementasi, lihat:
- Hook logic: [useCustomerLocation.js](laundrop-web/src/hooks/useCustomerLocation.js)
- Integration: [Order.jsx lines 293-380](laundrop-web/src/pages/customer/Order/Order.jsx#L293-L380)
- Geolocation API docs: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
