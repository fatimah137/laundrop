import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-content">
          <div className="hero-badge">✨ Laundry Service</div>
          <h1>
            Malas Laundry?<br />
            <span className="hero-accent">Serahkan ke<br />Laundrop!</span>
          </h1>
          <p>
            Nikmati layanan laundry terbaik kami untuk kamu dan keluarga. Kami jemput, cuci, dan antar pakaianmu kembali dalam kondisi bersih dan rapi sampai di depan pintu — dalam 24 jam.
          </p>
          <div className="hero-actions">
            <a href="#" className="btn-primary">Pesan Sekarang</a>
            <a href="#services" className="btn-outline">Lihat Harga</a>
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
  )
}
