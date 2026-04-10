import './CTA.css'

export default function CTA() {
  return (
    <section className="cta">
      <div className="container cta-inner">
        <div className="cta-content">
          <h2>Cucian Bersih, Tanpa Ribet</h2>
          <p>
            Jadwalkan sekarang dan nikmati kemudahan layanan laundry profesional
            langsung di depan pintu Anda. Cepat, bersih, dan terpercaya.
          </p>
          <a href="#" className="btn-primary">Pesan Sekarang</a>
        </div>
        <div className="cta-image">
          <img
            src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&q=80"
            alt="Laundry Service"
          />
        </div>
      </div>
    </section>
  )
}
