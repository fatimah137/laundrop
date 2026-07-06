import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useRole } from '../../../context/RoleContext';
import {
  LayoutDashboard, ShoppingBag, Bell, UserCircle, Menu, X, LogOut, BarChart3
} from 'lucide-react';
import { createPortal } from 'react-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AppLayout.css';

// Menu bottom navbar mobile — hanya menu utama yang sering diakses
const EMPLOYEE_BOTTOM = [
  { key: 'dashboard',     path: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'orders',        path: 'orders',        icon: ShoppingBag,     label: 'Orders'    },
  { key: 'notifications', path: 'notifications', icon: Bell,            label: 'Notif'     },
  { key: 'profile',       path: 'profile',       icon: UserCircle,      label: 'Profile'   },
];

const OWNER_BOTTOM = [
  { key: 'dashboard',     path: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'orders',        path: 'orders',        icon: ShoppingBag,     label: 'Orders'    },
  { key: 'reports',       path: 'reports',       icon: BarChart3,       label: 'Reports'   },
  { key: 'profile',       path: 'profile',       icon: UserCircle,      label: 'Profile'   },
];

export default function AppLayout() {
  const { role, currentUser, can, logout } = useRole();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const bottomMenus = role === 'owner' ? OWNER_BOTTOM : EMPLOYEE_BOTTOM;
  const basePath    = role === 'owner' ? '/owner' : '/employee';

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">

      {/* ── Desktop sidebar ── */}
      <div className="sidebar-desktop">
        <Sidebar onNavigate={() => {}} />
      </div>

      {/* ── Mobile drawer sidebar ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`sidebar-mobile ${mobileOpen ? 'open' : ''}`}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="app-main">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          role={role}
          currentUser={currentUser}
          unreadCount={3}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Navbar Mobile ── */}
      <nav className="bottom-navbar">
        {bottomMenus.filter(m => can(m.key)).map(({ key, path, icon: Icon, label }) => (
          <NavLink
            key={key}
            to={`${basePath}/${path}`}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Tombol More — buka sidebar drawer (hanya untuk owner) */}
        {role === 'owner' && (
          <button
            className="bottom-nav-item"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} strokeWidth={2} />
            <span>More</span>
          </button>
        )}
      </nav>

      {/* Logout modal */}
      {showLogoutModal && createPortal(
        <div className="sidebar-logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="sidebar-logout-modal" onClick={e => e.stopPropagation()}>
            <div className="sidebar-logout-modal-icon"><LogOut size={28} /></div>
            <h3 className="sidebar-logout-modal-title">Keluar dari Akun?</h3>
            <p className="sidebar-logout-modal-desc">Apakah Anda yakin ingin keluar?</p>
            <div className="sidebar-logout-modal-actions">
              <button className="sidebar-btn-cancel" onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button className="sidebar-btn-confirm" onClick={handleLogoutConfirm}>Ya, Keluar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}