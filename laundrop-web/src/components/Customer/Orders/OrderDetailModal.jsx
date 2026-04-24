import { X, MapPin, Package } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import './OrderDetailModal.css';

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-order-label">Order ID</p>
            <h2 className="modal-order-id">{order.id}</h2>
          </div>
          <div className="modal-header-right">
            <StatusBadge status={order.status} />
            <button className="modal-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body">

          {/* Detail Grid */}
          <div className="detail-grid">
            <div className="detail-cell">
              <p className="detail-label">Service</p>
              <p className="detail-value">{order.service}</p>
            </div>
            <div className="detail-cell">
              <p className="detail-label">Date</p>
              <p className="detail-value">{order.date}</p>
            </div>
            <div className="detail-cell">
              <p className="detail-label">Weight</p>
              <p className="detail-value">{order.weight} kg</p>
            </div>
            <div className="detail-cell">
              <p className="detail-label">Total Price</p>
              <p className="detail-value price">Rp {order.price.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="address-section">
            <div className="address-row">
              <MapPin size={16} className="address-icon pickup" />
              <div>
                <p className="detail-label">Pickup</p>
                <p className="address-text">{order.pickupAddress}</p>
              </div>
            </div>
            <div className="address-row">
              <MapPin size={16} className="address-icon delivery" />
              <div>
                <p className="detail-label">Delivery</p>
                <p className="address-text">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="items-section">
              <p className="items-label">
                <Package size={12} /> Items
              </p>
              <div className="items-wrap">
                {order.items.map(item => (
                  <span key={item} className="item-chip">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="detail-cell">
              <p className="detail-label">Notes</p>
              <p className="address-text">{order.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="timeline-section">
            <p className="timeline-title">Order Timeline</p>
            <div className="timeline-list">
              {order.timeline.map((step, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-track">
                    <div className={`timeline-dot ${step.done ? 'done' : ''}`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    {i < order.timeline.length - 1 && (
                      <div className={`timeline-line ${step.done ? 'done' : ''}`} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <p className={`timeline-label ${step.done ? 'done' : ''}`}>{step.label}</p>
                    {step.time && <p className="timeline-time">{step.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}