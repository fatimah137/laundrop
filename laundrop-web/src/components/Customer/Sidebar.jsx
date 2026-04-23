import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Clock, Bell, User, Settings, WashingMachine, X, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Logo from '../../assets/Logo_Laundrop.png';
import './Sidebar.css';

// Sesuaikan path dengan App.jsx 
const navItems = [
  { path: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Ubah dari '/'
  { path: '/customer/order', label: 'Order', icon: ShoppingBag },
  { path: '/customer/history', label: 'Order History', icon: Clock },
  { path: '/customer/notification', label: 'Notifications', icon: Bell },
  { path: '/customer/profile', label: 'Profile', icon: User },
  { path: '/customer/setting', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { unreadCount, profile } = useApp();

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {/* Overlay Mobile */}
      {open && <div className="mobile-overlay" onClick={onClose} />}

      <aside className={`sidebar-container ${open ? 'is-open' : ''}`}>
        {/* Header Logo */}
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-box">
               <img src={Logo} alt="Laundrop" className="logo-img" /> {/* 👈 ganti ini */}
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
            // Logika pengecekan aktif: mencocokkan path di menu dengan URL browser
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

        {/* Bagian Bawah: Profil & Logout */}
        <div className="sidebar-footer">
          <div className="user-info-card">
            <div className="user-avatar-small">{initials}</div>
            <div className="user-text">
              <p className="user-name">{profile?.name || 'User'}</p>
              <p className="user-email">{profile?.email || ''}</p>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}