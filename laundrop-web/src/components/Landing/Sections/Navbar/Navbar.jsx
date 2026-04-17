import { useState } from 'react'
import './Navbar.css'
import logoImg from "../../../../assets/Logo_Laundrop.png";
import LoginModal from '../../../LoginModal';
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  const isLoggedIn = false

  const handleOrderClick = () => {
    if (!isLoggedIn) {
      setShowLogin(true)
    } else {
      navigate("/customer/dashboard")
    }
  }

  const handleLogin = () => {
    setShowLogin(false)
    navigate("/login")
  }

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">

          <a href="/" className="navbar-logo">
            <img src={logoImg} alt="Laundrop" className="logo-img" />
            <span>Laundrop</span>
          </a>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>

          <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            <li><a href="#">Beranda</a></li>
            <li><a href="#services">Layanan</a></li>
            <li><a href="#how">Cara Kerja</a></li>
            <li><a href="#pricing">Harga</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>

          <button
            onClick={handleOrderClick}
            className="btn-primary navbar-cta"
          >
            Pesan Sekarang
          </button>

        </div>
      </nav>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
    </>
  )
}