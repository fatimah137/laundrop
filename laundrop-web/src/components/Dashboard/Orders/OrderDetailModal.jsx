import { X } from 'lucide-react';
import StatusBadge from '../../shared/StatusBadge';
import './OrderDetailModal.css';

const STATUS_FLOW = ['pending', 'pickup', 'proses', 'siap', 'delivery', 'selesai'];

const STEP_LABELS = {
  pending:  'Pending',
  pickup:   'Pickup',
  proses:   'Proses',
  siap:     'Siap',
  delivery: 'Delivery',
  selesai:  'Selesai',
};

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const unit       = order.unit || 'kg';

  const calcedTotal = order.total_amount || 0;

  const rows = [
    { label: 'Order ID',    value: order.order_number || order.order_id },
    { label: 'Customer',    value: order.customer_name },
    { label: 'Phone',       value: order.customer_phone || '-' },
    { label: 'Alamat',      value: order.address || '-' },
    { label: 'Karyawan',    value: order.assigned_employee || '-' },
    { label: 'Layanan',     value: order.service_name || '-' },
    { label: unit === 'kg' ? 'Berat' : 'Jumlah Pakaian',
      value: unit === 'kg'
        ? (order.weight        ? `${order.weight} kg`        : `${order.quantity} kg`)
        : (order.total_clothes ? `${order.total_clothes} pcs` : `${order.quantity} pcs`) },
    { label: 'Catatan',     value: order.notes || '-' },
  ];

  return (
    <div className="odm-overlay" onClick={onClose}>
      <div className="odm-dialog" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="odm-header">
          <h2 className="odm-title">Detail Order</h2>
          <button className="odm-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="odm-body">

          {/* Status Stepper */}
          <div className="odm-stepper">
            {STATUS_FLOW.map((step, idx) => {
              const done   = idx <= currentIdx;
              const active = idx === currentIdx;
              return (
                <div key={step} className="odm-step-wrap">
                  <div className="odm-step-col">
                    <div className={`odm-step-dot ${active ? 'active' : done ? 'done' : ''}`}>
                      {idx + 1}
                    </div>
                    <span className={`odm-step-label ${active ? 'active' : done ? 'done' : ''}`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div className={`odm-step-line ${done && idx < currentIdx ? 'done' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Badges */}
          <div className="odm-badges">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment_status || 'unpaid'} type="payment" />
          </div>

          {/* Info Rows */}
          <div className="odm-rows">
            {rows.map(({ label, value }) => (
              <div key={label} className="odm-row">
                <span className="odm-row-label">{label}</span>
                <span className="odm-row-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="odm-total">
            <span className="odm-total-label">Total</span>
            <span className="odm-total-value">Rp {calcedTotal.toLocaleString('id-ID')}</span>
          </div>

        </div>
      </div>
    </div>
  );
}