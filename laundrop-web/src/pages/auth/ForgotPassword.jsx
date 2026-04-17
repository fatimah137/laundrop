import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="url(#logo-grad-fp1)"/>
      <path d="M10 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="18" cy="14" r="3.5" fill="#fff"/>
      <defs>
        <linearGradient id="logo-grad-fp1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA"/>
          <stop offset="1" stopColor="#2563EB"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: kirim email reset ke API
    navigate("/reset-password");
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

          <p className="auth-subtitle">
            Masukkan email dibawah untuk mereset password
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                className="auth-input-plain"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <p className="input-hint">
                we will send you a message to set or reset new password.
              </p>
            </div>

            <button className="btn-auth-primary" type="submit">
              Send
            </button>
          </form>

          <div className="auth-bottom">
            Ingat password?{" "}
            <button onClick={() => navigate("/login")}>Sign In</button>
          </div>
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