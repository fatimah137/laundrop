import './Services.css'

const services = [
  {
    icon: '🧺',
    title: 'Cuci Kering',
    desc: 'Layanan cuci dan kering profesional dengan mesin modern dan deterjen berkualitas tinggi.',
  },
  {
    icon: '👔',
    title: 'Cuci Setrika',
    desc: 'Pakaianmu dicuci bersih dan disetrika rapi sehingga siap pakai langsung.',
  },
  {
    icon: '⚡',
    title: 'Laundry Express',
    desc: 'Butuh cepat? Laundry Express kami selesai dalam 6 jam untuk kebutuhanmu yang mendesak.',
  },
  {
    icon: '🔥',
    title: 'Setrika Saja',
    desc: 'Cukup setrika saja untuk pakaian yang sudah dicuci namun belum sempat dirapikan.',
  },
]

export default function Services() {
  return (
    <section className="services" id="services">
      <div className="container">
        <h2 className="section-title">Layanan Laundry Profesional Kami</h2>
        <p className="section-subtitle">
          Kami menyediakan berbagai pilihan layanan laundry sesuai kebutuhan Anda.
        </p>

        <div className="services-grid">
          {services.map((s, i) => (
            <div key={i} className="service-card">
              <div className="service-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <a href="#" className="service-link">Lihat Harga →</a>
            </div>
          ))}
        </div>

        <div className="services-cta">
          <a href="#" className="btn-primary">Explore Semua Layanan</a>
        </div>
      </div>
    </section>
  )
}
