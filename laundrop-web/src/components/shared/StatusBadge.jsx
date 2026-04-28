import React from 'react';
import './StatusBadge.css';

const LABELS = {
  pending: 'Pending',
  pickup: 'Pickup',
  process: 'Processing',
  ready: 'Ready',
  delivery: 'Delivery',
  selesai: 'Completed',
  cancelled: 'Cancelled',
  paid: 'Paid',
  unpaid: 'Unpaid',
  proses: 'Processing', // Tambahan jika dummy data pakai 'proses'
};

export default function StatusBadge({ status, type = 'order' }) {
  // Menentukan class berdasarkan status (unpaid, paid, selesai, dll)
  const statusClass = status?.toLowerCase() || 'default';
  
  return (
    <span className={`badge-base badge-${statusClass}`}>
      <span className="badge-dot" />
      {LABELS[status] || status}
    </span>
  );
}

export { LABELS };