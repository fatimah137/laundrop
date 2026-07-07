import { useState } from 'react'
import './FAQ.css'

const faqs = [
  {
    q: 'Bagaimana cara kerja pickup and delivery?',
    a: 'Anda cukup memesan melalui website atau WhatsApp kami, tentukan jadwal penjemputan, dan tim kami akan datang ke lokasi Anda. Setelah selesai, pakaian akan diantarkan langsung ke depan pintu Anda.',
  },
  { q: 'Daerah mana saja yang bisa memesan Laundrop?', a: 'Saat ini kami melayani area Semarang dan sekitarnya. Silakan hubungi kami untuk memastikan area Anda terjangkau.' },
  { q: 'Bagaimana harga ditentukan untuk setiap layanan?', a: 'Harga dihitung berdasarkan berat pakaian (per kilogram). Anda bisa melihat daftar harga lengkap di bagian Pricing.' },
  { q: 'Apakah Laundrop memakai produk eco-friendly?', a: 'Ya, kami menggunakan deterjen ramah lingkungan yang aman untuk pakaian dan keluarga Anda.' },
  { q: 'Bisakah saya melacak pesanan secara real-time?', a: 'Ya! Kami akan mengirimkan notifikasi WhatsApp di setiap tahap proses laundry Anda.' },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="faq" id="faq">
      <div className="container">
        <h2 className="section-title landing-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Temukan jawaban atas pertanyaan yang paling sering ditanyakan.</p>

        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="faq-icon">{open === i ? '×' : '+'}</span>
              </button>
              {open === i && (
                <div className="faq-answer">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-cta">
          <p>Masih ada pertanyaan?</p>
          <a href="#" className="btn-primary">Hubungi Kami</a>
        </div>
      </div>
    </section>
  )
}
