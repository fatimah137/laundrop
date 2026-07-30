<div align="center">

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Status](https://img.shields.io/badge/Status-In_Development-F59E0B?style=for-the-badge)

</div>

---

# 🧺 Laundrop

> **Smart Laundry System** berbasis Progressive Web App (PWA) dengan implementasi AI OCR dan Location Tracking pada layanan antar-jemput.

Laundrop adalah sistem manajemen laundry modern yang memudahkan pelanggan memesan layanan laundry secara online lengkap dengan fitur penjemputan dan pengantaran cucian. Dibangun sebagai Tugas Akhir Program Studi Teknik Informatika, Politeknik Negeri Semarang 2026.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📱 **PWA** | Dapat diakses via browser, bisa di-install ke homescreen tanpa Play Store |
| 📍 **Location Tracking** | Pelacakan lokasi penjemputan & pengantaran cucian secara real-time |
| 👥 **Multi-Role** | Tiga peran pengguna: Customer, Karyawan, dan Owner |
| 💳 **Pembayaran Online** | Sistem pembayaran terintegrasi dengan berbagai metode |
| 📊 **Dashboard Owner** | Laporan transaksi, keuangan, dan kinerja karyawan |

---

## 🛠️ Teknologi

### Backend
- **Laravel 11** — PHP Framework
- **Laravel Sanctum** — API Authentication
- **MySQL 8** — Database

### Frontend
- **React 18** — UI Library
- **Vite** — Build Tool
- **Tailwind CSS** — Styling
- **Vite Plugin PWA** — PWA Configuration
- **React Router v6** — Routing
- **Axios** — HTTP Client
- **Zustand** — State Management

---

## 👩‍💻 Tim Pengembang

| Nama | NIM |
|------|-----|
| Desyana Dewi Hapsari | 3.34.23.1.08 |
| Fatimah Fauzi Abdul Ghoni | 3.34.23.1.11 |

> Pembimbing I: Tahan Prahara, S.T., M.Kom.  
> Pembimbing II: Amran Yobioktabera, S.Kom., M.Kom.

---

## 📁 Struktur Proyek

```
laundrop/
├── laundrop-api/          # Backend Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── .env.example
│
└── laundrop-web/          # Frontend React PWA
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── store/
    │   └── services/
    ├── public/
    └── .env.example
```

---

## 🚀 Panduan Clone & Setup

### Prasyarat

Pastikan software berikut sudah terinstall di komputer kamu:

- [Git](https://git-scm.com/downloads)
- [PHP 8.2+](https://www.php.net/downloads)
- [Composer](https://getcomposer.org/download/)
- [Node.js 20+](https://nodejs.org/)
- [MySQL 8](https://dev.mysql.com/downloads/)
- [VS Code](https://code.visualstudio.com/)

---

### 1️⃣ Clone Repository

Buka terminal di VS Code (`Ctrl + \``) lalu jalankan:

```bash
git clone https://github.com/fatimah137/laundrop.git
cd laundrop
```

---

### 2️⃣ Setup Backend (laundrop-api)

```bash
# Masuk ke folder backend
cd laundrop-api

# Install dependency PHP
composer install

# Salin file environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

Buka file `.env` lalu sesuaikan konfigurasi database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laundrop_db
DB_USERNAME=root
DB_PASSWORD=password_kamu
```

Lanjutkan setup database:

```bash
# Jalankan migrasi dan seeder
php artisan migrate --seed

# Jalankan server backend
php artisan serve
```

> ✅ Backend berjalan di: `http://localhost:8000`

---

### 3️⃣ Setup Frontend (laundrop-web)

Buka terminal baru (`Ctrl + Shift + \``) lalu jalankan:

```bash
# Masuk ke folder frontend
cd laundrop-web

# Install dependency Node.js
npm install

# Salin file environment
cp .env.example .env
```

Buka file `.env` lalu sesuaikan URL backend:

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Laundrop
```

Jalankan server frontend:

```bash
npm run dev
```

> ✅ Frontend berjalan di: `http://localhost:5173`

---

### 4️⃣ Buka di VS Code

```bash
# Buka seluruh proyek sekaligus
code .
```

Atau buka dua window terpisah:

```bash
# Window 1 — backend
cd laundrop-api && code .

# Window 2 — frontend
cd laundrop-web && code .
```

---

## 🌿 Alur Kerja Git (Wajib Diikuti)

### Setiap hari sebelum mulai coding:

```bash
git checkout develop
git pull origin develop
```

### Saat mengerjakan fitur baru:

```bash
# 1. Buat branch baru dari develop
git checkout -b feature/nama-fitur

# 2. Setelah selesai coding
git add .
git commit -m "feat: deskripsi singkat fitur"
git push origin feature/nama-fitur
```

Lalu buka GitHub → buat **Pull Request** ke branch `develop` → minta review teman → merge.

### Konvensi commit message:

| Prefix | Kegunaan | Contoh |
|--------|----------|--------|
| `feat:` | Fitur baru | `feat: tambah halaman login` |
| `fix:` | Perbaikan bug | `fix: error validasi form order` |
| `style:` | Perubahan tampilan | `style: update warna tombol checkout` |
| `docs:` | Dokumentasi | `docs: update README setup` |
| `refactor:` | Refaktor kode | `refactor: pisah logic OCR ke service` |
| `chore:` | Konfigurasi | `chore: install package axios` |

---

## 🌐 Branch Strategy

```
main          ← kode final yang sudah stabil & teruji
  └── develop ← branch utama pengerjaan sehari-hari
        ├── feature/auth
        ├── feature/orders
        ├── feature/ocr
        ├── feature/location-tracking
        └── feature/dashboard-owner
```

> ⚠️ **Jangan langsung push ke branch `main`**. Semua perubahan harus melalui Pull Request ke `develop` terlebih dahulu.

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan Tugas Akhir. © 2026 Desyana Dewi Hapsari & Fatimah Fauzi Abdul Ghoni — Politeknik Negeri Semarang.
