# Quick Start Guide

## 🚀 5 Menit Setup

### 1️⃣ Install Dependencies (2 menit)

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2️⃣ Setup Environment (1 menit)

```bash
cp .env.example .env
```

Edit `.env` (optional untuk development):
```env
FLASK_ENV=development
PORT=5000
```

### 3️⃣ Start Service (1 menit)

```bash
python app.py
```

Buka `http://localhost:5000/health` di browser → harus muncul `{"status": "ok"}`

### 4️⃣ Test API (1 menit)

```bash
# Buka PowerShell/Terminal baru (dengan venv yang sama)
curl -X POST http://localhost:5000/api/predict/revenue \
  -H "Content-Type: application/json" \
  -d '{"company_id":1,"period_days":30,"historical_data":[100000,120000,95000,110000,125000,98000,115000,120000,105000,125000]}'
```

✅ **Done!** ML Service sudah running.

---

## 📚 Dokumentasi Lengkap

- **[README.md](./README.md)** - Dokumentasi lengkap
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Setup step-by-step dengan Laravel & React
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arsitektur sistem & data flow

---

## 🔗 Langkah Berikutnya

1. ✅ ML Service jalan
2. ⏭️ **[Setup Laravel Integration](./SETUP_GUIDE.md#step-4-create-laravel-ml-controller)** - 15 menit
3. ⏭️ **[Create React Components](./SETUP_GUIDE.md#step-5-create-react-components)** - 20 menit
4. ⏭️ **Test End-to-End** - 10 menit

---

## 🆘 Troubleshooting

### ❌ Module not found error
```bash
# Make sure venv is activated
pip install -r requirements.txt --force-reinstall
```

### ❌ Port 5000 already in use
```bash
# Windows - find process
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

### ❌ Can't reach localhost:5000 from Laravel
Pastikan:
1. ML Service is running: `curl http://localhost:5000/health`
2. Firewall allows localhost:5000
3. LARAVEL_API_URL in `.env` is correct

---

## 💡 Tips

- Dokumentasi lengkap di [README.md](./README.md)
- Sample training: `python training/train_models.py`
- Check logs di output terminal
- Keep browser DevTools open untuk debug React

---

Enjoy! 🎉 Untuk detail lebih lanjut, baca [README.md](./README.md)
