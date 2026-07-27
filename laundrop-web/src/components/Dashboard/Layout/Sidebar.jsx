import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, Sparkles, Wallet,
  BarChart3, Bell, UserCircle, Settings, UsersRound, LogOut, Brain,
  ChevronDown, TrendingUp, ChartColumnIncreasing, Users2, Lightbulb
} from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import Logo from '../../../assets/Logo_Laundrop.png';
import './Sidebar.css';

const ALL_MENUS = [
  { key: 'dashboard',     path: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard',     group: 'main' },
  { key: 'orders',        path: 'orders',        icon: ShoppingBag,     label: 'Orders',        group: 'main' },
  { key: 'customers',     path: 'customers',     icon: Users,           label: 'Customers',     group: 'main' },
  { key: 'employees',     path: 'employees',     icon: UsersRound,      label: 'Employees',     group: 'main' },
  { key: 'services',      path: 'services',      icon: Sparkles,        label: 'Services',      group: 'main' },
  { key: 'payment',       path: 'payment',       icon: Wallet,          label: 'Payment',       group: 'finance' },
  { key: 'reports',       path: 'reports',       icon: BarChart3,       label: 'Reports',       group: 'finance' },
  { key: 'ml-dashboard',  path: 'ml-dashboard',  icon: Brain,           label: 'Business AI',   group: 'finance' },
  { key: 'notifications', path: 'notifications', icon: Bell,            label: 'Notifications', group: 'system' },
  { key: 'profile',       path: 'profile',       icon: UserCircle,      label: 'Profile',       group: 'system' },
  { key: 'settings',      path: 'settings',      icon: Settings,        label: 'Settings',      group: 'system' },
];

const GROUPS = [
  { key: 'main',    label: 'Main' },
  { key: 'finance', label: 'Finance' },
  { key: 'system',  label: 'System' },
];

const BUSINESS_AI_SUBMENUS = [
  { key: 'ml-revenue',         path: 'ml-dashboard/revenue',         label: 'Prediksi Revenue', icon: TrendingUp },
  { key: 'ml-demand',          path: 'ml-dashboard/demand',          label: 'Prediksi Demand', icon: ChartColumnIncreasing },
  { key: 'ml-churn',           path: 'ml-dashboard/churn',           label: 'Prediksi Churn', icon: Users2 },
  { key: 'ml-recommendations', path: 'ml-dashboard/recommendations', label: 'Rekomendasi Bisnis', icon: Lightbulb },
];

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, currentUser, can, logout } = useRole();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [businessAIOpen, setBusinessAIOpen] = useState(true);

  const roleLabel = role === 'owner' ? 'Owner' : 'Employee';
  const menus     = ALL_MENUS.filter(m => can(m.key));
  const businessAISubmenus = BUSINESS_AI_SUBMENUS.filter(m => can(m.key));
  const isBusinessAIActive = location.pathname.includes('/ml-dashboard');
  const initials  = currentUser?.name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'U';

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img src={Logo} alt="Laundrop" className="logo-img" />
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
                  {groupMenus.map(({ key, path, icon: Icon, label }) => {
                    if (key !== 'ml-dashboard') {
                      return (
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
                      );
                    }

                    return (
                      <li key={key} className="sidebar-nav-dropdown-item">
                        <button
                          type="button"
                          onClick={() => setBusinessAIOpen(prev => !prev)}
                          className={`sidebar-nav-link sidebar-dropdown-trigger ${isBusinessAIActive ? 'active' : ''}`}
                        >
                          <div className="sidebar-link-main">
                            <Icon size={18} strokeWidth={2} />
                            <span>{label}</span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`sidebar-dropdown-chevron ${businessAIOpen ? 'open' : ''}`}
                          />
                        </button>

                        {businessAIOpen && businessAISubmenus.length > 0 && (
                          <ul className="sidebar-submenu-list">
                            {businessAISubmenus.map(({ key: subKey, path: subPath, label: subLabel, icon: SubIcon }) => (
                              <li key={subKey}>
                                <NavLink
                                  to={subPath}
                                  onClick={onNavigate}
                                  className={({ isActive }) =>
                                    `sidebar-submenu-link ${isActive ? 'active' : ''}`
                                  }
                                >
                                  <SubIcon size={14} strokeWidth={2} />
                                  <span>{subLabel}</span>
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
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
              <p className="sidebar-user-name">{currentUser?.name}</p>
              <p className="sidebar-user-email">{currentUser?.email}</p>
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