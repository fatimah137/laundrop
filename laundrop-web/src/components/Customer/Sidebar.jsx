import { useState } from 'react'; // 👈 tambah
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Clock, Bell, User, Settings, X, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Logo from '../../assets/Logo_Laundrop.png';
import './Sidebar.css';

const navItems = [
  { path: '/customer/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/customer/order',         label: 'Order',         icon: ShoppingBag },
  { path: '/customer/history',       label: 'Order History', icon: Clock },
  { path: '/customer/notification', label: 'Notifications', icon: Bell },
  { path: '/customer/profile',       label: 'Profile',       icon: User },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, profile, logout } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false); // 👈 tambah

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

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
            const active = location.pathname === path;
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
              <p className="user-name">{profile?.name || 'User'}</p>
              <p className="user-email">{profile?.email || ''}</p>
            </div>
          </div>

          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <LogOut size={28} />
            </div>
            <h3 className="logout-modal-title">Keluar dari Akun?</h3>
            <p className="logout-modal-desc">
              Apakah Anda yakin ingin keluar dari akun Anda?
            </p>
            <div className="logout-modal-actions">
              <button
                className="btn-logout-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Batal
              </button>
              <button
                className="btn-logout-confirm"
                onClick={handleLogoutConfirm}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}