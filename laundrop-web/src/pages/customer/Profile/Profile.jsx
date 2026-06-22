import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit2, Check, X, Lock, Eye, EyeOff, Camera, LogOut } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useRole } from '../../../context/RoleContext';
import Layout from '../../../components/Customer/Layout';
import './Profile.css';

function Field({ icon: Icon, label, value }) {
  return (
    <div className="profile-field">
      <Icon size={16} className="profile-field-icon" />
      <div>
        <p className="profile-field-label">{label}</p>
        <p className="profile-field-value">{value || '-'}</p>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="password-wrapper">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className="form-input"
        />
        <button type="button" className="password-toggle" onClick={onToggle}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { profile, updateProfile } = useApp();
  const { logout }                 = useRole();
  const navigate                   = useNavigate();

  const [editing, setEditing]               = useState(false);
  const [form, setForm]                     = useState(profile || {});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [photo, setPhoto]                   = useState(() => localStorage.getItem('laundrop_photo') || null);
  const [photoPreview, setPhotoPreview]     = useState(null);
  const photoInputRef                       = useRef(null);

  const [pwForm, setPwForm]       = useState({ old: '', new: '', confirm: '' });
  const [pwShow, setPwShow]       = useState({ old: false, new: false, confirm: false });
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const savePhoto = () => {
    localStorage.setItem('laundrop_photo', photoPreview);
    setPhoto(photoPreview);
    setPhotoPreview(null);
  };

  const handleSave = () => {
    if (updateProfile) updateProfile(form);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(profile || {});
    setEditing(false);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (!pwForm.old)                        { setPwError('Please enter your current password.'); return; }
    if (pwForm.new.length < 6)              { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.new !== pwForm.confirm)      { setPwError('Passwords do not match.'); return; }
    setPwSuccess(true);
    setPwForm({ old: '', new: '', confirm: '' });
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <Layout>
        <div className="profile-page">

          {/* Avatar */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {(photoPreview || photo) ? (
                <img src={photoPreview || photo} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-initials">{initials}</div>
              )}
              <button className="avatar-camera-btn" onClick={() => photoInputRef.current?.click()}>
                <Camera size={16} />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden-input"
              />
            </div>

            {photoPreview && (
              <div className="photo-actions">
                <button className="btn-cancel-photo" onClick={() => setPhotoPreview(null)}>Batal</button>
                <button className="btn-save-photo" onClick={savePhoto}>Simpan Foto</button>
              </div>
            )}

            <h2 className="avatar-name">{profile?.name || 'User'}</h2>
            <p className="avatar-email">{profile?.email || ''}</p>
          </div>

          {/* Personal Info */}
          <div className="profile-card">
            <div className="card-header">
              <h3 className="card-title">Personal Info</h3>
              {!editing ? (
                <button className="btn-edit" onClick={() => setEditing(true)}>
                  <Edit2 size={14} /> Edit
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-save" onClick={handleSave}>
                    <Check size={14} /> Save
                  </button>
                  <button className="btn-cancel" onClick={handleCancel}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="edit-form">
                {[
                  { key: 'name',    label: 'Full Name', icon: User,   type: 'text'  },
                  { key: 'email',   label: 'Email',     icon: Mail,   type: 'email' },
                  { key: 'phone',   label: 'Phone',     icon: Phone,  type: 'text'  },
                  { key: 'address', label: 'Address',   icon: MapPin, type: 'text'  },
                ].map(({ key, label, icon: Icon, type }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">
                      <Icon size={12} /> {label}
                    </label>
                    <input
                      type={type}
                      value={form[key] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="fields-list">
                <Field icon={User}   label="Full Name" value={profile?.name}    />
                <Field icon={Mail}   label="Email"     value={profile?.email}   />
                <Field icon={Phone}  label="Phone"     value={profile?.phone}   />
                <Field icon={MapPin} label="Address"   value={profile?.address} />
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="profile-card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>
              <Lock size={16} className="card-title-icon" /> Change Password
            </h3>
            <form onSubmit={handlePasswordUpdate} className="edit-form">
              <PasswordField
                label="Current Password"
                value={pwForm.old}
                onChange={e => setPwForm(prev => ({ ...prev, old: e.target.value }))}
                show={pwShow.old}
                onToggle={() => setPwShow(prev => ({ ...prev, old: !prev.old }))}
              />
              <PasswordField
                label="New Password"
                value={pwForm.new}
                onChange={e => setPwForm(prev => ({ ...prev, new: e.target.value }))}
                show={pwShow.new}
                onToggle={() => setPwShow(prev => ({ ...prev, new: !prev.new }))}
              />
              <PasswordField
                label="Confirm New Password"
                value={pwForm.confirm}
                onChange={e => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                show={pwShow.confirm}
                onToggle={() => setPwShow(prev => ({ ...prev, confirm: !prev.confirm }))}
              />

              {pwError && (
                <div className="pw-error"><X size={14} /> {pwError}</div>
              )}
              {pwSuccess && (
                <div className="pw-success"><Check size={14} /> Password updated successfully!</div>
              )}

              <button type="submit" className="btn-update-password">
                Update Password
              </button>
            </form>
          </div>

          {/* ✅ Logout button di halaman profile */}
          <div className="profile-card logout-card">
            <button className="btn-logout" onClick={() => setShowLogoutModal(true)}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </Layout>

      {/* ✅ Modal di luar Layout tapi dalam Fragment */}
      {showLogoutModal && createPortal(
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <LogOut size={28} />
            </div>
            <h3 className="logout-modal-title">Logout Dari Akun?</h3>
            <p className="logout-modal-desc">
              Apakah Anda yakin ingin logout dari akun Anda?
            </p>
            <div className="logout-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowLogoutModal(false)}>
                Batal
              </button>
              <button className="btn-modal-confirm" onClick={handleLogoutConfirm}>
                Ya, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}