import { useState } from 'react'
import './Navbar.css'
import logoImg from "../../../../assets/Logo_Laundrop.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="#" className="navbar-logo">
          <img src={logoImg} alt="Laundrop" className="logo-img" />
          <span>Laundrop</span>
        </a>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><a href="#">Beranda</a></li>
          <li><a href="#services">Layanan</a></li>
          <li><a href="#how">Cara Kerja</a></li>
          <li><a href="#pricing">Harga</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <a href="/Pesan Sekarang" className="btn-primary navbar-cta">
          Pesan Sekarang
        </a>
      </div>
    </nav>
  )
}