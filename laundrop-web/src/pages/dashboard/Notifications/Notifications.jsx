import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import api from '../../../services/api';
import { useRole } from '../../../context/RoleContext';
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

function resolveNotificationType(notification) {
  const rawType = String(notification?.type || '').toLowerCase();
  const title = String(notification?.title || '').toLowerCase();
  const body = String(notification?.body || '').toLowerCase();
  const text = `${title} ${body}`;

  // Database enum values: order_created, status_changed, payment_request, payment_success, reminder
  
  if (rawType === 'payment_success') return 'success';
  if (rawType === 'payment_request') return 'warning';
  if (rawType === 'order_created') return 'info';
  if (rawType === 'reminder') return 'warning';
  
  if (rawType === 'status_changed') {
    if (text.includes('selesai') || text.includes('siap')) return 'success';
    if (text.includes('dibatalkan') || text.includes('gagal')) return 'error';
    if (text.includes('menunggu')) return 'warning';
    return 'info';
  }

  return 'info';
}

export default function Notifications() {
  const { decrementUnreadCount } = useRole();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch notifications from API
  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/notifications');
        const payload = response?.data?.data;
        const rows = payload?.notifications?.data ?? [];

        if (!mounted) return;

        const mappedNotifications = rows.map((n) => ({
          id: n.id,
          read: Boolean(n.is_read),
          type: resolveNotificationType(n),
          title: n.title || 'Notifikasi',
          message: n.body || n.title || 'Notifikasi baru',
          created_date: n.created_at,
        }));

        setItems(mappedNotifications);
        setUnread(Number(payload?.unread_count ?? 0));
      } catch (err) {
        if (!mounted) return;
        setItems([]);
        setUnread(0);
        setError(err?.response?.data?.message || 'Gagal memuat notifikasi');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const markRead = async (id) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.read) return;

    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
    decrementUnreadCount();

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      setUnread((prev) => prev + 1);
    }
  };

  const markAllRead = async () => {
    if (unread === 0) return;

    const countToDecrement = unread;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);

    // Update context unread count
    for (let i = 0; i < countToDecrement; i++) {
      decrementUnreadCount();
    }

    try {
      await api.patch('/notifications/read-all');
    } catch {
      const previous = items;
      setItems(previous);
      const restoredUnread = previous.filter((n) => !n.read).length;
      setUnread(restoredUnread);
    }
  };

  const deleteItem = async (id) => {
    const target = items.find((n) => n.id === id);
    setItems((prev) => prev.filter((n) => n.id !== id));

    // If was unread, decrement count
    if (target && !target.read) {
      setUnread((prev) => Math.max(0, prev - 1));
      decrementUnreadCount();
    }

    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      // Restore on error
      setItems((prev) => [...prev, target]);
      if (target && !target.read) {
        setUnread((prev) => prev + 1);
      }
    }
  };

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
      {loading ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            <Bell size={26} />
          </div>
          <p className="notif-empty-title">Memuat notifikasi...</p>
        </div>
      ) : error ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            <Bell size={26} />
          </div>
          <p className="notif-empty-title">Terjadi kesalahan</p>
          <p className="notif-empty-desc">{error}</p>
        </div>
      ) : items.length === 0 ? (
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