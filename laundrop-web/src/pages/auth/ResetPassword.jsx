import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Logo from "../../assets/Logo_Laundrop.png";
import "./auth.css";

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
  const [searchParams] = useSearchParams();
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ newPass: "", confirmPass: "" });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Link reset tidak valid atau sudah kadaluarsa. Silakan minta link baru.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPass !== form.confirmPass) {
      setError("Password tidak cocok!");
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: form.newPass,
        password_confirmation: form.confirmPass,
      });
      navigate('/reset-success');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Gagal reset password. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">

          <div className="auth-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Laundrop" className="auth-logo-img" />
            <span className="auth-logo-text">Laundrop</span>
          </div>

          <h1 className="auth-title">Forgot Password?</h1>

          <p className="auth-subtitle">Masukkan password baru Anda</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>

            <div className="auth-field">
              <label>Enter New Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showNew ? "text" : "password"}
                  placeholder="Masukkan password baru Anda"
                  value={form.newPass}
                  onChange={e => setForm({ ...form, newPass: e.target.value })}
                  disabled={loading || !token || !email}
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

            <div className="auth-field">
              <label>Re-enter New Password</label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={form.confirmPass}
                  onChange={e => setForm({ ...form, confirmPass: e.target.value })}
                  disabled={loading || !token || !email}
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

            <button className="btn-auth-primary" type="submit" disabled={loading || !token || !email}>
              {loading ? 'Memproses...' : 'Confirm'}
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