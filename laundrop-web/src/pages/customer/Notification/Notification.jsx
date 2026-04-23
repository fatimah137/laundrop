import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import Layout from '../../../components/Customer/Layout';
import './Notification.css';

export default function Notifications() {
  const { notifications, markNotificationRead, markAllRead, unreadCount } = useApp();

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

        {/* Empty State */}
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Bell size={32} />
            </div>
            <p className="notif-empty-title">No notifications</p>
            <p className="notif-empty-sub">You're all caught up!</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
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