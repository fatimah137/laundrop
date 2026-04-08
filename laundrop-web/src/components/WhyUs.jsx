import './WhyUs.css'

const reasons = [
  'Cuci bersih & higienis',
  'Antar jemput gratis',
  'Pilihan deterjen berkualitas',
  'Siap, terjangkau',
  'Tidak ada biaya tambahan',
]

export default function WhyUs() {
  return (
    <section className="whyus">
      <div className="container whyus-inner">
        <div className="whyus-image">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
            alt="Why Laundrop"
          />
        </div>
        <div className="whyus-content">
          <h2>Kenapa Pilih Laundrop?</h2>
          <p>Kami menawarkan berbagai keunggulan layanan laundry yang sudah dipercaya ribuan pelanggan.</p>
          <ul>
            {reasons.map((r, i) => (
              <li key={i}>
                <span className="check">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
