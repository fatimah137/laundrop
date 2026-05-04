import { useState } from 'react';
import { User, Lock, Save, Check, AlertCircle } from 'lucide-react';
import { useRole }    from '../../../context/RoleContext';
import PageHeader     from '../../../components/shared/PageHeader';
import './Profile.css';

/* ── Toast sederhana (tanpa library) ────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const Toast = () => (
    <div className="prf-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`prf-toast prf-toast-${t.type}`}>
          {t.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {t.msg}
        </div>
      ))}
    </div>
  );

  return { show, Toast };
}

/* ── Inisial avatar ──────────────────────────────────────────────── */
function InitialAvatar({ name, size = 80 }) {
  const colors  = ['#2563EB','#7C3AED','#0F766E','#C2410C','#15803D'];
  const idx     = (name?.charCodeAt(0) || 0) % colors.length;
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

/* ── Main Component ──────────────────────────────────────────────── */
export default function Profile() {
  const { currentUser, role, roleLabel } = useRole();
  const { show, Toast } = useToast();

  const [profile, setProfile] = useState({
    name:  currentUser?.name  || 'Admin Owner',
    email: currentUser?.email || 'admin@laundry.com',
    phone: currentUser?.phone || '+62 812-0000-0000',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const saveProfile = (e) => {
    e.preventDefault();
    show('Profil berhasil disimpan');
  };

  const changePw = (e) => {
    e.preventDefault();
    if (!pw.current) return show('Masukkan password saat ini', 'error');
    if (pw.next.length < 6) return show('Password baru minimal 6 karakter', 'error');
    if (pw.next !== pw.confirm) return show('Konfirmasi password tidak cocok', 'error');
    show('Password berhasil diubah');
    setPw({ current: '', next: '', confirm: '' });
  };

  const displayRole = roleLabel || role || 'Owner';

  return (
    <div className="prf-page">
      <Toast />

      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi pribadi dan keamanan akun."
      />

      <div className="prf-layout">

        {/* ── Kiri: avatar card ── */}
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
            <span className="prf-av-info-val" style={{ textTransform: 'capitalize' }}>{role || 'owner'}</span>
          </div>
        </div>

        {/* ── Kanan: form ── */}
        <div className="prf-forms">

          {/* Form informasi pribadi */}
          <div className="prf-card">
            <div className="prf-form-title">
              <User size={16} className="prf-form-icon" />
              <h3>Informasi Pribadi</h3>
            </div>

            <form onSubmit={saveProfile}>
              <div className="prf-grid-2">
                <div className="prf-field">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                <div className="prf-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@contoh.com"
                    required
                  />
                </div>
                <div className="prf-field">
                  <label>Nomor Telepon</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+62 8xx xxxx xxxx"
                  />
                </div>
                <div className="prf-field">
                  <label>Role</label>
                  <input
                    type="text"
                    value={displayRole}
                    disabled
                    className="disabled"
                  />
                </div>
              </div>

              <button type="submit" className="prf-btn-save">
                <Save size={14} /> Simpan Perubahan
              </button>
            </form>
          </div>

          {/* Form ganti password */}
          <div className="prf-card">
            <div className="prf-form-title">
              <Lock size={16} className="prf-form-icon" />
              <h3>Ganti Password</h3>
            </div>

            <form onSubmit={changePw}>
              <div className="prf-grid-3">
                <div className="prf-field">
                  <label>Password Saat Ini</label>
                  <input
                    type="password"
                    value={pw.current}
                    onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="prf-field">
                  <label>Password Baru</label>
                  <input
                    type="password"
                    value={pw.next}
                    onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                    placeholder="Min. 6 karakter"
                  />
                </div>
                <div className="prf-field">
                  <label>Konfirmasi Password</label>
                  <input
                    type="password"
                    value={pw.confirm}
                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>

              <button type="submit" className="prf-btn-outline">
                <Lock size={14} /> Perbarui Password
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}