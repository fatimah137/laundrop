// src/components/Customer/Layout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, ShoppingBag, Clock, UserCircle
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const BOTTOM_MENUS = [
  { path: '/customer',         label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customer/order',   label: 'Order',     icon: ShoppingBag     },
  { path: '/customer/history', label: 'History',   icon: Clock           },
  { path: '/customer/profile', label: 'Profile',   icon: UserCircle      },
];

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useRole();
  const navigate   = useNavigate();

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const handleMenuClick = () => {
    console.log('📱 Layout: Menu clicked, setting sidebar open');
    setIsSidebarOpen(true);
  };

  return (
    <div className="layout-container">

      {/* Sidebar — notif & logout ada di dalam sidebar */}
      <Sidebar
        open={isSidebarOpen}
        onClose={() => {
          console.log('📱 Layout: Closing sidebar');
          setIsSidebarOpen(false);
        }}
        onLogout={() => setShowLogoutModal(true)}
      />

      <div className="main-wrapper">
        <Header onMenuClick={handleMenuClick} />
        <main className="content-area">
          {children}
        </main>
      </div>

      {/* ✅ Bottom Navbar — 4 menu saja */}
      <nav className="customer-bottom-nav">
        {BOTTOM_MENUS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/customer'}
            className={({ isActive }) =>
              `customer-bottom-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout modal */}
      {showLogoutModal && createPortal(
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 className="logout-modal-title">Keluar dari Akun?</h3>
            <p className="logout-modal-desc">Apakah Anda yakin ingin keluar?</p>
            <div className="logout-modal-actions">
              <button className="btn-logout-cancel" onClick={() => setShowLogoutModal(false)}>
                Batal
              </button>
              <button className="btn-logout-confirm" onClick={handleLogoutConfirm}>
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Layout;