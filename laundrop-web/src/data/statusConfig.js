export const STATUS_CONFIG = {
  pending:   { label: 'Pending',    color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  pickup:    { label: 'Pickup',     color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  proses:    { label: 'Diproses',   color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' }, 
  siap:      { label: 'Siap',       color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  delivery:  { label: 'Dikirim',    color: '#06b6d4', bg: '#cffafe', text: '#164e63' }, 
  selesai:   { label: 'Selesai',    color: '#6366f1', bg: '#e0e7ff', text: '#3730a3' },
  cancelled: { label: 'Dibatalkan', color: '#ef4444', bg: '#fee2e2', text: '#991b1b' }, // 
};

export const PAYMENT_CONFIG = {
  paid:   { label: 'Lunas',       color: '#22c55e', bg: '#dcfce7', text: '#166534' },
  unpaid: { label: 'Belum Bayar', color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
};

export const getStatusConfig = (status, type = 'order') => {
  const config = type === 'payment' ? PAYMENT_CONFIG : STATUS_CONFIG;
  return config[status] ?? {
    label: status,
    color: '#9ca3af',
    bg:    '#f3f4f6',
    text:  '#374151',
  };
};