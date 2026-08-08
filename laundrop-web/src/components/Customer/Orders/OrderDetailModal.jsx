import { X, MapPin, Package } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../../ui/StatusBadge';
import './OrderDetailModal.css';

const formatRp = (n) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function OrderDetailModal({ order, onClose, onCancel, canCancel = false, cancelling = false }) {
  if (!order) return null;

  // ✅ Breakdown harga detail
  const deliveryFee = Number(order.extraFee || 0);
  const totalPrice = Number(order.price || 0);
  
  let laundryPrice = Number(order.laundryPrice || 0);
  if (laundryPrice <= 0 && Number(order.estimated_price || 0) > 0) {
    // Fallback: calculated from estimated_price and delivery fee
    laundryPrice = Math.max(0, Number(order.estimated_price) - deliveryFee);
  }
  if (laundryPrice <= 0 && totalPrice > 0) {
    // Last fallback: from price and delivery fee
    laundryPrice = Math.max(0, totalPrice - deliveryFee);
  }

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

        {/* QR Code Section */}
        <div className="qr-code-section">
          <QRCodeSVG 
            value={order.id} 
            size={120}
            level="H"
            includeMargin={true}
            className="order-qr-code"
          />
          <p className="qr-label">Tunjukkan ke karyawan untuk scan</p>
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

          {/* ✅ Price Breakdown */}
          <div className="detail-price-breakdown">
            <p className="breakdown-title">Rincian Harga</p>
            <div className="breakdown-row">
              <span className="breakdown-label">Harga Layanan</span>
              <span className="breakdown-value">{formatRp(laundryPrice)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="breakdown-row">
                <span className="breakdown-label">Ongkos Kirim</span>
                <span className="breakdown-value">+ {formatRp(deliveryFee)}</span>
              </div>
            )}
            <div className="breakdown-row breakdown-total">
              <span className="breakdown-label">Total</span>
              <span className="breakdown-value">{formatRp(totalPrice)}</span>
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

          {canCancel && typeof onCancel === 'function' && (
            <div className="detail-actions">
              <button
                type="button"
                className="detail-cancel-btn"
                onClick={onCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Membatalkan...' : 'Cancel Order'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}