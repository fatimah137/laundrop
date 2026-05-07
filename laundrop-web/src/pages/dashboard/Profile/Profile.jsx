import { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import PageHeader from '../../../components/shared/PageHeader';
import Toast from '../../../components/shared/Toast';
import './Profile.css';

function InitialAvatar({ name, size = 80 }) {
  const colors = ['#2563EB','#7C3AED','#0F766E','#C2410C','#15803D'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div
      className="prf-avatar"
      style={{
        width: size,
        height: size,
        background: colors[idx],
        fontSize: size * 0.36
      }}
    >
      {initials}
    </div>
  );
}

export default function Profile() {
  const { currentUser, role, roleLabel } = useRole();

  // ✅ pakai toast global
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [profile, setProfile] = useState({
    name:  currentUser?.name  || 'Admin Owner',
    email: currentUser?.email || 'admin@laundry.com',
    phone: currentUser?.phone || '+62 812-0000-0000',
  });

  const [pw, setPw] = useState({
    current: '',
    next: '',
    confirm: ''
  });

  const saveProfile = (e) => {
    e.preventDefault();
    showToast('Profil berhasil disimpan!', 'success');
  };

  const changePw = (e) => {
    e.preventDefault();

    if (!pw.current) {
      return showToast('Masukkan password saat ini', 'danger');
    }

    if (pw.next.length < 6) {
      return showToast('Password minimal 6 karakter', 'danger');
    }

    if (pw.next !== pw.confirm) {
      return showToast('Konfirmasi tidak cocok', 'danger');
    }

    showToast('Password berhasil diubah!', 'success');

    setPw({
      current: '',
      next: '',
      confirm: ''
    });
  };

  const displayRole = roleLabel || role || 'Owner';

  return (
    <div className="prf-page">

      {/* ✅ Toast GLOBAL */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Profil Saya"
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
            <span className="prf-av-info-val">
              {role || 'owner'}
            </span>
          </div>
        </div>

        {/* Forms */}
        <div className="prf-forms">

          {/* Profile */}
          <div className="prf-card">
            <div className="prf-form-title">
              <User size={16} />
              <h3>Informasi Pribadi</h3>
            </div>

            <form onSubmit={saveProfile}>
              <div className="prf-grid-2">

                <div className="prf-field">
                  <label>Nama</label>
                  <input
                    value={profile.name}
                    onChange={e =>
                      setProfile(p => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="prf-field">
                  <label>Email</label>
                  <input
                    value={profile.email}
                    onChange={e =>
                      setProfile(p => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="prf-field">
                  <label>Telepon</label>
                  <input
                    value={profile.phone}
                    onChange={e =>
                      setProfile(p => ({ ...p, phone: e.target.value }))
                    }
                  />
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

          {/* Password */}
          <div className="prf-card">
          <div className="prf-form-title">
            <Lock size={16} />
            <h3>Change Password</h3>
          </div>

          <form onSubmit={changePw} className="prf-forms">

          <div className="prf-grid-3">

          <div className="prf-field">
            <label>Current</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={pw.current}
              onChange={e =>
            setPw(p => ({ ...p, current: e.target.value }))
          }
        />
      </div>

      <div className="prf-field">
        <label>New</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={pw.next}
          onChange={e =>
            setPw(p => ({ ...p, next: e.target.value }))
          }
        />
      </div>

      <div className="prf-field">
        <label>Confirm</label>
        <input
          type="password"
          placeholder="Confirm password"
          value={pw.confirm}
          onChange={e =>
            setPw(p => ({ ...p, confirm: e.target.value }))
          }
        />
      </div>

    </div>

    <button className="prf-btn-outline">
      <Lock size={14} /> Update Password
    </button>

  </form>
</div>

        </div>
      </div>
    </div>
  );
}