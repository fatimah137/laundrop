import './StatusBadge.css';

export default function StatusBadge({ status }) {
  const statusClass = {
    'Completed':   'badge-completed',
    'Cancelled':   'badge-cancelled',
    'On Progress': 'badge-progress',
    'Pending':     'badge-pending',
  }[status] || 'badge-pending';

  return (
    <span className={`status-badge ${statusClass}`}>
      {status}
    </span>
  );
}