import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../context/RoleContext"; // ✅ ganti dari useApp
import Logo from "../../assets/Logo_Laundrop.png";
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ✅ Redirect berdasarkan role
const REDIRECT_BY_ROLE = {
  customer: '/customer',
  employee: '/employee/dashboard',
  owner:    '/owner/dashboard',
};

export default function Login() {
  const navigate    = useNavigate();
  const { login }   = useRole(); // ✅ ganti dari useApp

  const [showPass, setShowPass]   = useState(false);
  const [form, setForm]           = useState({ email: "", password: "" });
  const [error, setError]         = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = login(form.email, form.password); // ✅ login dari RoleContext

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate(REDIRECT_BY_ROLE[user.role]); // ✅ redirect sesuai role
      }, 1500);

    } catch (err) {
      setError(err.message); // ✅ pesan error dari RoleContext
    }
  };

  return (
    <div className="auth-page">

      {showToast && (
        <div className="auth-toast">
          ✓ Berhasil masuk! Mengalihkan...
        </div>
      )}

      <main className="auth-main">
        <div className="auth-card">

          <div className="auth-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Laundrop" className="auth-logo-img" />
            <span className="auth-logo-text">Laundrop</span>
          </div>

          <h1 className="auth-title">Sign In</h1>

          <button className="btn-google" type="button">
            <GoogleIcon />
            Sign In using <strong>Google</strong>
          </button>

          <div className="auth-divider">or sign in with your email</div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                className="auth-input-plain"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
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

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-forgot">
              <button
                type="button"
                className="forgot-link"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn-auth-primary">
              Sign In
            </button>
          </form>

          {/* ✅ Update hint sesuai akun di RoleContext */}
          <div className="auth-hint">
            <p>Gunakan akun demo:</p>
            <p>Customer &nbsp;— <strong>user@laundrop.id</strong> / <strong>1234</strong></p>
            <p>Employee &nbsp;— <strong>emp@laundrop.id</strong> / <strong>1234</strong></p>
            <p>Owner &nbsp;&nbsp;&nbsp;&nbsp;— <strong>owner@laundrop.id</strong> / <strong>1234</strong></p>
          </div>

          <div className="auth-bottom">
            Don't have an account?{" "}
            <button type="button" onClick={() => navigate("/register")}>
              Sign Up
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}