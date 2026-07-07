import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import Layout from '../../../components/Customer/Layout';
import api from '../../../services/api';
import './Notification.css';

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mappedNotifications = useMemo(
    () => notifications.map((n) => ({
      id: n.id,
      read: Boolean(n.is_read),
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
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

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
          <div>
            <h1 className="notif-title">Notifications</h1>
            {unreadCount > 0 && (
              <p className="notif-subtitle">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllRead}>
              <CheckCheck size={16} /> Mark all read
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
            <p className="notif-empty-title">No notifications</p>
            <p className="notif-empty-sub">You're all caught up!</p>
          </div>
        ) : (
          <div className="notif-list">
            {mappedNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`notif-item ${n.read ? 'read' : 'unread'}`}
              >
                <div className={`notif-icon ${n.read ? 'read' : 'unread'}`}>
                  <Bell size={20} />
                </div>
                <div className="notif-content">
                  <p className={`notif-message ${n.read ? 'read' : 'unread'}`}>{n.message}</p>
                  <p className="notif-time">{n.time}</p>
                </div>
                {!n.read && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}