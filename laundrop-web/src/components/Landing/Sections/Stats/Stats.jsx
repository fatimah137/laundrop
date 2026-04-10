import './Stats.css'

const stats = [
  { value: '5,000+', label: 'Pelanggan' },
  { value: '24h', label: 'Layanan Cepat' },
  { value: '100%', label: 'Garansi Bersih' },
]

export default function Stats() {
  return (
    <section className="stats">
      <div className="container stats-inner">
        {stats.map(({ value, label }) => (
          <div key={label} className="stat-item">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
