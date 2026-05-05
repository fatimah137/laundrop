import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, Sparkles, Wallet,
  BarChart3, Bell, UserCircle, Settings, UsersRound, Waves, LogOut
} from 'lucide-react';
import './Sidebar.css';

const ALL_MENUS = [
  { key: 'dashboard',     path: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard',     group: 'main' },
  { key: 'orders',        path: 'orders',        icon: ShoppingBag,     label: 'Orders',        group: 'main' },
  { key: 'customers',     path: 'customers',     icon: Users,           label: 'Customers',     group: 'main' },
  { key: 'services',      path: 'services',      icon: Sparkles,        label: 'Services',      group: 'main' },
  { key: 'payment',       path: 'payment',       icon: Wallet,          label: 'Payment',       group: 'finance' },
  { key: 'reports',       path: 'reports',       icon: BarChart3,       label: 'Reports',       group: 'finance' },
  { key: 'notifications', path: 'notifications', icon: Bell,            label: 'Notifications', group: 'system' },
  { key: 'employees',     path: 'employees',     icon: UsersRound,      label: 'Employees',     group: 'system' },
  { key: 'profile',       path: 'profile',       icon: UserCircle,      label: 'Profile',       group: 'system' },
  { key: 'settings',      path: 'settings',      icon: Settings,        label: 'Settings',      group: 'system' },
];

// Menu yang bisa diakses employee
const EMPLOYEE_MENUS = ['dashboard', 'orders', 'notifications', 'profile'];

const GROUPS = [
  { key: 'main',    label: 'Main' },
  { key: 'finance', label: 'Finance' },
  { key: 'system',  label: 'System' },
];

export default function Sidebar({ onNavigate, role = 'owner' }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentUser = {
    name:  role === 'owner' ? 'Admin Owner' : 'Karyawan',
    email: role === 'owner' ? 'owner@laundrop.com' : 'employee@laundrop.com',
  };

  const roleLabel = role === 'owner' ? 'Owner' : 'Employee';

  // Filter menu berdasarkan role
  const menus = role === 'owner'
    ? ALL_MENUS
    : ALL_MENUS.filter(m => EMPLOYEE_MENUS.includes(m.key));

  const initials = currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('');

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Waves size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar-logo-name">Laundrop</div>
            <div className="sidebar-logo-role">{roleLabel} Panel</div>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="sidebar-nav">
          {GROUPS.map(group => {
            const groupMenus = menus.filter(m => m.group === group.key);
            if (groupMenus.length === 0) return null;
            return (
              <div key={group.key} className="sidebar-nav-group">
                <p className="sidebar-nav-group-label">{group.label}</p>
                <ul>
                  {groupMenus.map(({ key, path, icon: Icon, label }) => (
                    <li key={key}>
                      <NavLink
                        to={path}
                        end={path.endsWith('dashboard')}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `sidebar-nav-link ${isActive ? 'active' : ''}`
                        }
                      >
                        <Icon size={18} strokeWidth={2} />
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer User */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{currentUser.name}</p>
              <p className="sidebar-user-email">{currentUser.email}</p>
            </div>
          </div>

          <button
            className="sidebar-logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Modal Logout — di-render langsung ke document.body via Portal
           agar tidak terpengaruh z-index / stacking context parent manapun */}
      {showLogoutModal && createPortal(
        <div className="sidebar-logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="sidebar-logout-modal" onClick={e => e.stopPropagation()}>
            <div className="sidebar-logout-modal-icon">
              <LogOut size={28} />
            </div>
            <h3 className="sidebar-logout-modal-title">Keluar dari Akun?</h3>
            <p className="sidebar-logout-modal-desc">
              Apakah Anda yakin ingin keluar dari akun Anda?
            </p>
            <div className="sidebar-logout-modal-actions">
              <button className="sidebar-btn-cancel" onClick={() => setShowLogoutModal(false)}>
                Batal
              </button>
              <button className="sidebar-btn-confirm" onClick={handleLogoutConfirm}>
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}