import { Shirt, Zap, Sparkles, Clock } from "lucide-react";
import "./ServiceCards.css";

const SERVICES = [
  {
    id: "regular",
    name: "Regular Wash",
    icon: Shirt,
    price: "$5 / kg",
    duration: "2–3 days",
    desc: "Standard wash, dry & fold for everyday clothes.",
    color: "blue",
  },
  {
    id: "express",
    name: "Express Wash",
    icon: Zap,
    price: "$10 / kg",
    duration: "Same day",
    desc: "Fast turnaround — done within 4 hours of pickup.",
    color: "orange",
  },
  {
    id: "dry",
    name: "Dry Cleaning",
    icon: Sparkles,
    price: "$15 / kg",
    duration: "3–5 days",
    desc: "Delicate care for suits, gowns & special garments.",
    color: "purple",
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