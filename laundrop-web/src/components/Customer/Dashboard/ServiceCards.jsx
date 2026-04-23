import { Shirt, Zap, Sparkles, Clock } from "lucide-react";
import "./ServiceCards.css";

const SERVICES = [
  {
    id:       "cuci-setrika",
    name:     "Cuci + Setrika",
    icon:     Shirt,
    price:    "Rp 10.000 / kg",
    duration: "2–3 hari",
    desc:     "Mencuci dan menyetrika pakaian sehari-hari.",
    color:    "blue",
  },
  {
    id:       "setrika",
    name:     "Setrika Saja",
    icon:     Zap,
    price:    "Rp 5.000 / kg",
    duration: "1–2 hari",
    desc:     "Hanya menyetrika pakaian yang sudah dicuci.",
    color:    "orange",
  },
  {
    id:       "cuci-kering",
    name:     "Cuci Kering",
    icon:     Sparkles,
    price:    "Rp 40.000 / pcs",
    duration: "3–5 hari",
    desc:     "Perawatan khusus untuk jas, gaun & pakaian formal.",
    color:    "purple",
  },
  {
    id:       "express",
    name:     "Express (24 Jam)",
    icon:     Clock,
    price:    "Rp 15.000 / kg",
    duration: "24 jam",
    desc:     "Selesai dalam 24 jam setelah penjemputan.",
    color:    "green",
  },
];

export default function ServiceCards() {
  return (
    <div className="services">
      <div className="services-grid">
        {SERVICES.map(({ id, name, icon: Icon, price, duration, desc, color }) => (
          <div key={id} className={`card ${color}`}>
            <div className="icon-box">
              <Icon size={20} />
            </div>
            <p className="name">{name}</p>
            <p className="desc">{desc}</p>
            <div className="card-footer">
              <span className="price">{price}</span>
              <span className="duration">
                <Clock size={14} /> {duration}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}