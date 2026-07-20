import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../../../LoginModal'
import './Hero.css'

export default function Hero() {
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  const isLoggedIn = Boolean(localStorage.getItem('auth_token'))

  const handleOrderClick = (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      setShowLogin(true)
    } else {
      navigate('/customer/dashboard')
    }
  }

  const handleLogin = () => {
    setShowLogin(false)
    navigate('/login')
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge">Laundry Service</div>
            <h1>
              Malas Laundry?<br />
              <span className="hero-accent">Serahkan ke<br />Laundrop!</span>
            </h1>
            <p>
              Nikmati layanan laundry terbaik kami untuk kamu dan keluarga. Kami jemput, cuci, dan antar pakaianmu kembali dalam kondisi bersih dan rapi sampai di depan pintu — dalam 24 jam.
            </p>
            <div className="hero-actions">
              <a href="#" className="btn-primary" onClick={handleOrderClick}>Pesan Sekarang</a>
              <a href="#pricing" className="btn-outline">Lihat Harga</a>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-img-wrapper">
              <img
                src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&q=80"
                alt="Laundry Service"
              />
            </div>
          </div>
        </div>
      </section>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
    </>
  )
}
