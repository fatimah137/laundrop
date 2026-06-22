import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Clock, Bell, User, Settings, X, LogOut } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import Logo from '../../assets/Logo_Laundrop.png';
import './Sidebar.css';

// ✅ Semua menu ada di sidebar termasuk notif
const navItems = [
  { path: '/customer',              label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/customer/order',        label: 'Order',         icon: ShoppingBag     },
  { path: '/customer/history',      label: 'Order History', icon: Clock           },
  { path: '/customer/notification', label: 'Notifications', icon: Bell            },
  { path: '/customer/profile',      label: 'Profile',       icon: User            },
  { path: '/customer/setting',      label: 'Settings',      icon: Settings        },
];

export default function Sidebar({ open, onClose, onLogout }) {
  const location               = useLocation();
  const { currentUser, unreadCount } = useRole();

  const initials = currentUser?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {open && <div className="mobile-overlay" onClick={onClose} />}

      <aside className={`sidebar-container ${open ? 'is-open' : ''}`}>

        {/* Header Logo */}
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-box">
              <img src={Logo} alt="Laundrop" className="logo-img" />
            </div>
            <span className="logo-text">Laundrop</span>
          </div>
          <button className="close-mobile-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="sidebar-nav">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = path === '/customer'
              ? location.pathname === '/customer'
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span>{label}</span>
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="notif-badge-count">{unreadCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info-card">
            <div className="user-avatar-small">{initials}</div>
            <div className="user-text">
              <p className="user-name">{currentUser?.name || 'User'}</p>
              <p className="user-email">{currentUser?.email || ''}</p>
            </div>
          </div>

          {/* ✅ Logout ada di sidebar */}
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}