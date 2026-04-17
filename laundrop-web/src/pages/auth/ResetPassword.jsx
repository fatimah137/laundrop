import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="url(#logo-grad-rp)"/>
      <path d="M10 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="18" cy="14" r="3.5" fill="#fff"/>
      <defs>
        <linearGradient id="logo-grad-rp" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA"/>
          <stop offset="1" stopColor="#2563EB"/>
        </linearGradient>
      </defs>
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ newPass: "", confirmPass: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPass !== form.confirmPass) {
      alert("Password tidak cocok!");
      return;
    }
    // TODO: kirim ke API
    navigate("/reset-success");
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-logo" onClick={() => navigate("/")}>
            <LogoIcon />
            <span className="auth-logo-text">Laundrop</span>
          </div>

          {/* Title */}
          <h1 className="auth-title">Forgot Password?</h1>

          <p className="auth-subtitle">Masukkan password baru Anda</p>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* New Password */}
            <div className="auth-field">
              <label>Enter New Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showNew ? "text" : "password"}
                  placeholder="Masukkan password baru Anda"
                  value={form.newPass}
                  onChange={e => setForm({ ...form, newPass: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowNew(v => !v)}
                >
                  <EyeIcon open={showNew} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label>Re-enter New Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={form.confirmPass}
                  onChange={e => setForm({ ...form, confirmPass: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirm(v => !v)}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            <button className="btn-auth-primary" type="submit">
              Confirm
            </button>
          </form>

        </div>
      </main>

      <footer className="auth-footer">
        <span className="auth-footer-copy">© 2026 laundrop.com</span>
        <div className="auth-footer-links">
          <a href="#">Contact Us</a>
          <a href="#">Terms &amp; Conditions</a>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}