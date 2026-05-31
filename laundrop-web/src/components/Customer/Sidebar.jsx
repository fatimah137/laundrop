import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Clock, Bell, User, X, LogOut } from 'lucide-react';
import { useRole } from '../../context/RoleContext'; // 
import Logo from '../../assets/Logo_Laundrop.png';
import './Sidebar.css';

const navItems = [
  { path: '/customer',              label: 'Dashboard',     icon: LayoutDashboard }, // ✅ ganti path
  { path: '/customer/order',        label: 'Order',         icon: ShoppingBag },
  { path: '/customer/history',      label: 'Order History', icon: Clock },
  { path: '/customer/notification', label: 'Notifications', icon: Bell },
  { path: '/customer/profile',      label: 'Profile',       icon: User },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useRole(); // ✅ ganti dari useApp
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const initials = currentUser?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // ✅ unreadCount bisa dari props atau state lokal dulu
  const unreadCount = 0;

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout(); // ✅ logout dari RoleContext — clear localStorage sekaligus
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
            // ✅ highlight dashboard kalau path persis /customer
            // highlight menu lain kalau path startsWith
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

          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* Modal Logout */}
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
              <button className="btn-logout-cancel" onClick={() => setShowLogoutModal(false)}>
                Batal
              </button>
              <button className="btn-logout-confirm" onClick={handleLogoutConfirm}>
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}