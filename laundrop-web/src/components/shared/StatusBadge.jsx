import { STATUS_CONFIG, PAYMENT_CONFIG } from '../../data/statusConfig';
import './StatusBadge.css';

export default function StatusBadge({ status, type = 'order' }) {
  const config = type === 'payment' ? PAYMENT_CONFIG : STATUS_CONFIG;
  const cfg    = config[status] ?? { label: status, color: '#9ca3af', bg: '#f3f4f6', text: '#374151' };

  return (
    <span
      className="status-badge-base"
      style={{
        background:  cfg.bg,
        color:       cfg.text,
        borderColor: cfg.color + '40',
      }}
    >
      <span className="status-badge-dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}