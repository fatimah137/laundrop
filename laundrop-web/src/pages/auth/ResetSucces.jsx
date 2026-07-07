import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo_Laundrop.png";
import "./auth.css";

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">

          <div className="auth-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Laundrop" className="auth-logo-img" />
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