import { useNavigate } from "react-router-dom";
import "./auth.css";

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="url(#logo-grad-rs)"/>
      <path d="M10 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="18" cy="14" r="3.5" fill="#fff"/>
      <defs>
        <linearGradient id="logo-grad-rs" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA"/>
          <stop offset="1" stopColor="#2563EB"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-logo" onClick={() => navigate("/")}>
            <LogoIcon />
            <span className="auth-logo-text">Laundrop</span>
          </div>

          {/* Success content */}
          <div className="auth-success-wrap">

            {/* Check icon */}
            <div className="auth-success-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            {/* Title */}
            <h1 className="auth-success-title">All set well done!</h1>

            {/* Subtitle with lines */}
            <p className="auth-success-sub">
              Try to login for next step.
            </p>

            {/* Button */}
            <button
              className="btn-auth-primary"
              onClick={() => navigate("/login")}
            >
              Back to login
            </button>
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