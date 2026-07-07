import { useState } from 'react'
import './HowItWorks.css'

const steps = [
  { num: '01', title: 'Jadwalkan Pesanan', desc: 'Pilih layanan dan jadwal penjemputan yang sesuai keinginanmu.' },
  { num: '02', title: 'Kami Jemput', desc: 'Tim kami akan menjemput pakaianmu tepat waktu sesuai jadwal.' },
  { num: '03', title: 'Proses Pencucian', desc: 'Pakaianmu dicuci dengan mesin modern dan deterjen premium berkualitas.' },
  { num: '04', title: 'Kami Antar', desc: 'Pakaian bersih dan rapi diantarkan langsung ke depan pintumu.' },
]

export default function HowItWorks() {
  const [active, setActive] = useState(2)

  return (
    <section className="how" id="how">
      <div className="container">
        <h2 className="section-title landing-title">Laundry dalam satu Klik!</h2>
        <p className="section-subtitle">Pesan mudah, simple, dan proses layanan Laundrop.</p>

        <div className="steps">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`step ${active === i ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="how-cta">
          <a href="#" className="btn-primary">Pesan Sekarang</a>
        </div>
      </div>
    </section>
  )
}
