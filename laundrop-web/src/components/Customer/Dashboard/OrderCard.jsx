import './OrderCard.css';
import { Calendar, MapPin, Truck } from 'lucide-react';

export default function OrderCard({ order, onTrack }) {
  if (!order) return null;
  
  return (
    <div className="order-item">
      <div className="order-top">
        <div className="order-id-group">
          <span className="order-id">{order.id}</span>
          <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
            {order.status}
          </span>
        </div>
        <span className="order-price">${order.price.toFixed(2)}</span>
      </div>

      <div className="order-mid">
        <div className="info-detail">
          <Calendar size={14} /> <span>{order.pickupDate} · {order.pickupTime}</span>
        </div>
        <div className="info-detail">
          <MapPin size={14} /> <span>{order.pickupAddress}</span>
        </div>
      </div>

      <button className="track-button" onClick={() => onTrack(order)}>
        <Truck size={14} /> Track Order
      </button>
    </div>
  );
}