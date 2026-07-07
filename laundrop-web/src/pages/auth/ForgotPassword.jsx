import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo_Laundrop.png";
import api from "../../services/api";
import "./auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data?.message ?? 'Link reset password telah dikirim. Cek email Anda.');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Gagal mengirim email reset password.');
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
          <p className="auth-subtitle">
            Masukkan email dibawah untuk mereset password
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                className="auth-input-plain"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <p className="input-hint">
                we will send you a message to set or reset new password.
              </p>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button className="btn-auth-primary" type="submit" disabled={loading}>
              {loading ? 'Mengirim...' : 'Send'}
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