import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Logo from "../../assets/Logo_Laundrop.png"; // 👈
import "./auth.css";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.password_confirmation) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    if (form.password.length < 8 || !/\d/.test(form.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError("Password minimal 8 karakter, mengandung angka dan simbol");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      setSuccess(response?.data?.message || "Akun berhasil dibuat");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      const validationErrors = err?.response?.data?.errors;

      if (validationErrors && typeof validationErrors === "object") {
        const firstError = Object.values(validationErrors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(apiMessage || "Gagal membuat akun");
      }
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Laundrop" className="auth-logo-img" /> {/* 👈 */}
            <span className="auth-logo-text">Laundrop</span>
          </div>

          <h1 className="auth-title">Register</h1>

          <button className="btn-google" type="button">
            <GoogleIcon />
            Register using <strong>Google</strong>
          </button>

          <div className="auth-divider">or register with your email</div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Nama Lengkap</label>
              <input
                className="auth-input-plain"
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Email Address</label>
              <input
                className="auth-input-plain"
                type="email"
                placeholder="Masukkan email Anda"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Phone Number</label>
              <input
                className="auth-input-plain"
                type="tel"
                placeholder="Masukkan nomor Anda"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPass(v => !v)}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Konfirmasi Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Ulangi password Anda"
                  value={form.password_confirmation}
                  onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmPass(v => !v)}
                >
                  <EyeIcon open={showConfirmPass} />
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="auth-checkbox-row">
              <input
                className="auth-checkbox"
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              <label className="auth-checkbox-label" htmlFor="agree">
                By Signing Up I agree with{" "}
                <a href="#">Terms &amp; Conditions</a>
              </label>
            </div>

            <button
              className="btn-auth-primary"
              type="submit"
              disabled={!agreed}
            >
              Register
            </button>
          </form>

          <div className="auth-bottom">
            Already have an Account?{" "}
            <button onClick={() => navigate("/login")}>Login</button>
          </div>
        </div>
      </main>

      <footer className="auth-footer">
        <span className="auth-footer-copy">© 2026 laundrop.com</span> {/* 👈 fix tahun */}
        <div className="auth-footer-links">
          <a href="#">Contact Us</a>
          <a href="#">Terms &amp; Conditions</a>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}