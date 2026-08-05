import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Layout from '../../../components/Customer/Layout';
import api from '../../../services/api';
import { useRole } from '../../../context/RoleContext';
import './Notification.css';

const TYPE_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const TYPE_COLOR = {
  info: 'notif-icon-info',
  success: 'notif-icon-success',
  warning: 'notif-icon-warning',
  error: 'notif-icon-error',
};

const TYPE_ITEM_CLASS = {
  info: 'notif-item-info',
  success: 'notif-item-success',
  warning: 'notif-item-warning',
  error: 'notif-item-error',
};

function resolveNotificationType(notification) {
  const rawType = String(notification?.type || '').toLowerCase();
  const title = String(notification?.title || '').toLowerCase();
  const body = String(notification?.body || '').toLowerCase();
  const text = `${title} ${body}`;

  if (rawType === 'payment_due') return 'warning';
  if (rawType === 'payment_success') return 'success';
  if (rawType === 'order_cancelled') return 'error';
  if (rawType === 'order_created') return 'info';
  if (rawType === 'status_updated') {
    if (text.includes('selesai') || text.includes('siap')) return 'success';
    if (text.includes('dibatalkan')) return 'error';
    return 'info';
  }

  if (rawType === 'order_cancelled' || text.includes('dibatalkan') || text.includes('gagal')) {
    return 'error';
  }

  if (rawType === 'payment_due' || text.includes('menunggu pembayaran') || text.includes('pembayaran tertunda')) {
    return 'warning';
  }

  if (
    rawType === 'payment_success' ||
    text.includes('selesai') ||
    text.includes('berhasil') ||
    text.includes('lunas') ||
    text.includes('siap dikirim')
  ) {
    return 'success';
  }

  return 'info';
}

function formatRelativeTime(value) {
  if (!value) return '-';

  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return '-';

  const diffMs = Date.now() - target;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'baru saja';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} menit lalu`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} jam lalu`;
  return `${Math.floor(diffMs / day)} hari lalu`;
}

export default function Notifications() {
  const { decrementUnreadCount } = useRole();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mappedNotifications = useMemo(
    () => notifications.map((n) => ({
      id: n.id,
      read: Boolean(n.is_read),
      type: resolveNotificationType(n),
      title: n.title || 'Notifikasi',
      message: n.body || n.title || 'Notifikasi baru',
      time: formatRelativeTime(n.created_at),
    })),
    [notifications]
  );

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
        setNotifications(rows);
        setUnreadCount(Number(payload?.unread_count ?? 0));
      } catch (err) {
        if (!mounted) return;
        setNotifications([]);
        setUnreadCount(0);
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

  const markNotificationRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.is_read) return;

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    decrementUnreadCount(); // Update context

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
      setUnreadCount((prev) => prev + 1);
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;

    const previous = notifications;
    const countToDecrement = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // Update context unread count
    for (let i = 0; i < countToDecrement; i++) {
      decrementUnreadCount();
    }

    try {
      await api.patch('/notifications/read-all');
    } catch {
      setNotifications(previous);
      const restoredUnread = previous.filter((n) => !n.is_read).length;
      setUnreadCount(restoredUnread);
    }
  };

  return (
    <Layout>
      <div className="notif-page">

        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-text">
            <h1 className="notif-title">Notifikasi</h1>
            <p className="notif-subtitle">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="notif-btn-markall" onClick={markAllRead}>
              <CheckCheck size={16} /> Tandai semua
            </button>
          )}
        </div>

        {error && <div className="notif-error">{error}</div>}

        {/* Empty State */}
        {loading ? (
          <div className="notif-loading">Memuat notifikasi...</div>
        ) : mappedNotifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Bell size={32} />
            </div>
            <p className="notif-empty-title">Tidak ada notifikasi</p>
            <p className="notif-empty-sub">Semua notifikasi akan muncul di sini.</p>
          </div>
        ) : (
          <div className="notif-list">
            {mappedNotifications.map(n => {
              const Icon = TYPE_ICON[n.type] || Bell;
              const color = TYPE_COLOR[n.type] || 'notif-icon-info';
              const itemTypeClass = TYPE_ITEM_CLASS[n.type] || 'notif-item-info';

              return (
                <div
                  key={n.id}
                  className={`notif-item ${itemTypeClass}${!n.read ? ' unread' : ''}`}
                >
                  <div className={`notif-icon-box ${color}`}>
                    <Icon size={20} />
                  </div>
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
                            onClick={() => markNotificationRead(n.id)}
                            title="Tandai sudah dibaca"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={`notif-message ${n.read ? 'read' : 'unread'}`}>{n.message}</p>
                    <p className="notif-time">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}