import './Pricing.css'

const plans = [
  {
    name: 'Cuci Kering',
    price: 'Rp5.000/kg',
    features: ['Mesin modern standar', 'Deterjen berkualitas', 'Tanpa setrika', 'Pickup & delivery'],
  },
  {
    name: 'Cuci Setrika',
    price: 'Rp6.000/kg',
    features: ['Mesin modern standar', 'Deterjen berkualitas', 'Setrika rapih & presisi', 'Pickup & delivery', 'Pewangi gratis'],
    popular: true,
  },
  {
    name: 'Laundry Express',
    price: 'Rp20.000/kg',
    features: ['Selesai dalam 6 jam', 'Deterjen premium', 'Setrika rapih & presisi', 'Priority pickup', 'Pewangi gratis', 'Notifikasi real-time'],
  },
]

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <h2 className="section-title landing-title">Praktis, Harga Terjangkau</h2>
        <p className="section-subtitle">Kami memberikan kualitas terbaik dengan harga yang terjangkau.</p>

        <div className="pricing-grid">
          {plans.map((p, i) => (
            <div key={i} className={`pricing-card ${p.popular ? 'popular' : ''}`}>
              {p.popular && <div className="popular-badge">Pilihan Terbaik</div>}
              <h3>{p.name}</h3>
              <div className="price">{p.price}</div>
              <a href="#" className="btn-primary pricing-btn">Pilih Layanan</a>
              <ul>
                {p.features.map((f, j) => (
                  <li key={j}>
                    <span className="check-icon">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
