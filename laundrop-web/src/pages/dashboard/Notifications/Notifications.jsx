import { useState } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import './Notifications.css';

const TYPE_ICON = {
  info:    Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   XCircle,
};

const TYPE_COLOR = {
  info:    'notif-icon-info',
  success: 'notif-icon-success',
  warning: 'notif-icon-warning',
  error:   'notif-icon-error',
};

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type:         'success',
    title:        'Order Selesai',
    message:      'Pesanan LD-260429-1061 milik Budi Hartono telah selesai diproses.',
    created_date: '2026-05-01T10:30:00.000Z',
    read:         false,
  },
  {
    id: 2,
    type:         'info',
    title:        'Pesanan Baru',
    message:      'Pesanan baru masuk dari Maya Anggraini untuk layanan Kilat.',
    created_date: '2026-05-01T09:15:00.000Z',
    read:         false,
  },
  {
    id: 3,
    type:         'warning',
    title:        'Pembayaran Tertunda',
    message:      'Pesanan LD-260429-5889 belum melakukan pembayaran.',
    created_date: '2026-04-30T14:00:00.000Z',
    read:         false,
  },
  {
    id: 4,
    type:         'info',
    title:        'Status Diperbarui',
    message:      'Pesanan LD-260428-2618 telah berubah status menjadi Siap.',
    created_date: '2026-04-30T11:00:00.000Z',
    read:         true,
  },
  {
    id: 5,
    type:         'error',
    title:        'Pesanan Dibatalkan',
    message:      'Pesanan LD-260426-4452 milik Lina Marlina telah dibatalkan.',
    created_date: '2026-04-29T08:45:00.000Z',
    read:         true,
  },
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('id-ID', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
};

export default function Notifications() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  const unread = items.filter(i => !i.read).length;

  const markRead    = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = ()   => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const deleteItem  = (id) => setItems(prev => prev.filter(n => n.id !== id));

  return (
    <div className="notif-page">

      {/* ── Header ── */}
      <div className="notif-header">
        <div className="notif-header-text">
          <h1 className="notif-title">Notification</h1>
          <p className="notif-subtitle">
            {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unread > 0 && (
          <button className="notif-btn-markall" onClick={markAllRead}>
            <Check size={14} />
            Tandai semua
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {items.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            <Bell size={26} />
          </div>
          <p className="notif-empty-title">Tidak ada notifikasi</p>
          <p className="notif-empty-desc">Semua notifikasi akan muncul di sini.</p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map(n => {
            const Icon  = TYPE_ICON[n.type]  || Info;
            const color = TYPE_COLOR[n.type] || 'notif-icon-info';
            return (
              <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>

                {/* Icon badge */}
                <div className={`notif-icon-box ${color}`}>
                  <Icon size={17} />
                </div>

                {/* Body */}
                <div className="notif-content">
                  <div className="notif-title-row">
                    <span className="notif-item-title">
                      {n.title}
                      {!n.read && <span className="notif-dot" />}
                    </span>
                    <div className="notif-actions">
                      {!n.read && (
                        <button
                          className="notif-action-btn"
                          onClick={() => markRead(n.id)}
                          title="Tandai sudah dibaca"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        className="notif-action-btn danger"
                        onClick={() => deleteItem(n.id)}
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="notif-message">{n.message}</p>
                  <p className="notif-time">{formatDateTime(n.created_date)}</p>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}