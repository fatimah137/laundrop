import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  User, Lock, Save, LogOut,
  UsersRound, Sparkles, Wallet, BarChart3,
  Bell, Settings, ChevronRight
} from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import PageHeader from '../../../components/shared/PageHeader';
import Toast from '../../../components/shared/Toast';
import './Profile.css';

function InitialAvatar({ name, size = 80 }) {
  const colors = ['#2563EB','#7C3AED','#0F766E','#C2410C','#15803D'];
  const idx      = (name?.charCodeAt(0) || 0) % colors.length;
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div
      className="prf-avatar"
      style={{ width: size, height: size, background: colors[idx], fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ✅ Menu tambahan yang hanya muncul di mobile (di bawah profile)
const MORE_MENUS = [
  { path: 'employees',     label: 'Employees',     icon: UsersRound },
  { path: 'services',      label: 'Services',      icon: Sparkles   },
  { path: 'payment',       label: 'Payment',       icon: Wallet     },
  { path: 'reports',       label: 'Reports',       icon: BarChart3  },
  { path: 'notifications', label: 'Notifications', icon: Bell       },
  { path: 'settings',      label: 'Settings',      icon: Settings   },
];

export default function Profile() {
  const { currentUser, role, roleLabel, logout, can } = useRole();
  const navigate = useNavigate();

  const [toast, setToast]                   = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [profile, setProfile] = useState({
    name:  currentUser?.name  || 'Admin Owner',
    email: currentUser?.email || 'admin@laundry.com',
    phone: currentUser?.phone || '+62 812-0000-0000',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const saveProfile = (e) => {
    e.preventDefault();
    showToast('Profil berhasil disimpan!', 'success');
  };

  const changePw = (e) => {
    e.preventDefault();
    if (!pw.current)              return showToast('Masukkan password saat ini', 'danger');
    if (pw.next.length < 6)       return showToast('Password minimal 6 karakter', 'danger');
    if (pw.next !== pw.confirm)   return showToast('Konfirmasi tidak cocok', 'danger');
    showToast('Password berhasil diubah!', 'success');
    setPw({ current: '', next: '', confirm: '' });
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const displayRole = roleLabel || role || 'Owner';

  // Filter menu sesuai permission
  const visibleMenus = MORE_MENUS.filter(m => can(m.path));
  const basePath     = role === 'owner' ? '/owner' : '/employee';

  return (
    <div className="prf-page">

      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Profile"
        subtitle="Kelola informasi pribadi dan keamanan akun."
      />

      <div className="prf-layout">

        {/* Avatar */}
        <div className="prf-card prf-avatar-card">
          <InitialAvatar name={profile.name} size={88} />
          <h3 className="prf-av-name">{profile.name}</h3>
          <p className="prf-av-email">{profile.email}</p>
          <span className="prf-role-badge">{displayRole}</span>
          <div className="prf-av-divider" />
          <div className="prf-av-info-row">
            <span className="prf-av-info-label">Telepon</span>
            <span className="prf-av-info-val">{profile.phone || '-'}</span>
          </div>
          <div className="prf-av-info-row">
            <span className="prf-av-info-label">Role</span>
            <span className="prf-av-info-val">{role || 'owner'}</span>
          </div>
        </div>

        {/* Forms */}
        <div className="prf-forms">

          {/* Informasi Pribadi */}
          <div className="prf-card">
            <div className="prf-form-title">
              <User size={16} />
              <h3>Informasi Pribadi</h3>
            </div>
            <form onSubmit={saveProfile}>
              <div className="prf-grid-2">
                <div className="prf-field">
                  <label>Nama</label>
                  <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="prf-field">
                  <label>Email</label>
                  <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="prf-field">
                  <label>Telepon</label>
                  <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="prf-field">
                  <label>Role</label>
                  <input value={displayRole} disabled />
                </div>
              </div>
              <button className="prf-btn-save">
                <Save size={14} /> Simpan
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="prf-card">
            <div className="prf-form-title">
              <Lock size={16} />
              <h3>Change Password</h3>
            </div>
            <form onSubmit={changePw} className="prf-forms">
              <div className="prf-grid-3">
                <div className="prf-field">
                  <label>Current</label>
                  <input type="password" placeholder="Enter current password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
                </div>
                <div className="prf-field">
                  <label>New</label>
                  <input type="password" placeholder="Enter new password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
                </div>
                <div className="prf-field">
                  <label>Confirm</label>
                  <input type="password" placeholder="Confirm password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
              <button className="prf-btn-outline">
                <Lock size={14} /> Update Password
              </button>
            </form>
          </div>

          {/* ✅ More Menu — hanya muncul di mobile */}
          {visibleMenus.length > 0 && (
            <div className="prf-card prf-more-card prf-mobile-only">
              <p className="prf-more-title">Menu Lainnya</p>
              <div className="prf-more-list">
                {visibleMenus.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={`${basePath}/${path}`}
                    className="prf-more-item"
                  >
                    <div className="prf-more-item-left">
                      <div className="prf-more-icon">
                        <Icon size={16} />
                      </div>
                      <span>{label}</span>
                    </div>
                    <ChevronRight size={16} className="prf-more-chevron" />
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="prf-card prf-logout-card">
            <button className="prf-btn-logout" onClick={() => setShowLogoutModal(true)}>
              <LogOut size={14} /> Logout
            </button>
          </div>

        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && createPortal(
        <div className="prf-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="prf-modal-box" onClick={e => e.stopPropagation()}>
            <div className="prf-modal-header">
              <h3>Logout?</h3>
              <button className="prf-modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
            </div>
            <div className="prf-modal-body">
              <p>Anda akan keluar dari akun ini. Yakin ingin melanjutkan?</p>
            </div>
            <div className="prf-modal-footer">
              <button className="prf-modal-btn-cancel" onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button className="prf-modal-btn-confirm" onClick={handleLogoutConfirm}>Logout</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}