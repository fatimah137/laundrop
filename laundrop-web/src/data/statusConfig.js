export const STATUS_CONFIG = {
  waiting_confirmation: { label: 'Menunggu Konfirmasi', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  pickup:               { label: 'Dalam Penjemputan',   color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  picked_up:            { label: 'Pakaian Diambil',     color: '#0ea5e9', bg: '#e0f2fe', text: '#075985' },
  waiting_payment:      { label: 'Menunggu Pembayaran', color: '#f97316', bg: '#ffedd5', text: '#9a3412' },
  washing:              { label: 'Proses Pencucian',    color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' },
  washing_finished:     { label: 'Pencucian Selesai',   color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  delivery:             { label: 'Dalam Pengantaran',   color: '#06b6d4', bg: '#cffafe', text: '#164e63' },
  completed:            { label: 'Selesai',             color: '#6366f1', bg: '#e0e7ff', text: '#3730a3' },
  cancelled:            { label: 'Dibatalkan',          color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },

  pending:   { label: 'Pending',    color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  proses:    { label: 'Diproses',   color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' }, 
  siap:      { label: 'Siap',       color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  selesai:   { label: 'Selesai',    color: '#6366f1', bg: '#e0e7ff', text: '#3730a3' },
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