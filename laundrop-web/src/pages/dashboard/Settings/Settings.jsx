import { useState, useRef } from 'react';
import { Building2, Save, Upload, Waves } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import Toast from '../../../components/shared/Toast';
import './Settings.css';

/* ── Data awal ───────────────────────────────── */
const INITIAL = {
  business_name: 'Laundrop',
  tagline:       'Bersih, Cepat, Terpercaya',
  phone:         '+62 812-0000-0000',
  email:         'laundrop@email.com',
  address:       'Jl. Contoh No.1, Semarang, Jawa Tengah',
  logo_url:      '',
};

export default function Settings() {
  const [data, setData]       = useState(INITIAL);
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState('');
  const [toast, setToast]     = useState(null);
  const fileRef               = useRef(null);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
  };

  /* Upload logo */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (PNG/JPG)', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setData(p => ({ ...p, logo_url: ev.target.result }));
      showToast('Logo berhasil diunggah', 'success');
    };

    reader.readAsDataURL(file);
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.business_name.trim()) {
      showToast('Nama bisnis wajib diisi', 'danger');
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);

    showToast('Pengaturan berhasil disimpan', 'success');
  };

  const logoSrc = preview || data.logo_url;

  return (
    <div className="set-page">

      {/* ✅ Toast global */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Settings"
        subtitle="Kelola profil perusahaan dan informasi branding."
      />

      <form className="set-card" onSubmit={handleSubmit}>

        <div className="set-section-title">
          <Building2 size={16} className="set-section-icon" />
          <h3>Profil Perusahaan</h3>
        </div>

        {/* Logo */}
        <div className="set-logo-row">
          <div className="set-logo-preview">
            {logoSrc
              ? <img src={logoSrc} alt="Logo" className="set-logo-img" />
              : <Waves size={34} className="set-logo-placeholder-icon" />
            }
          </div>

          <div className="set-logo-info">
            <p className="set-logo-label">Logo Bisnis</p>
            <p className="set-logo-hint">PNG atau JPG, rasio 1:1 direkomendasikan</p>

            <button
              type="button"
              className="set-btn-upload"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={13} />
              Unggah Logo
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="set-file-hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        <div className="set-divider" />

        {/* Fields */}
        <div className="set-fields">
          <div className="set-field">
            <label>Nama Bisnis *</label>
            <input
              required
              type="text"
              value={data.business_name}
              onChange={e => set('business_name', e.target.value)}
            />
          </div>

          <div className="set-field">
            <label>Tagline</label>
            <input
              type="text"
              value={data.tagline}
              onChange={e => set('tagline', e.target.value)}
            />
          </div>

          <div className="set-grid-2">
            <div className="set-field">
              <label>Nomor Telepon</label>
              <input
                type="tel"
                value={data.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>

            <div className="set-field">
              <label>Email</label>
              <input
                type="email"
                value={data.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
          </div>

          <div className="set-field">
            <label>Alamat</label>
            <textarea
              rows={3}
              value={data.address}
              onChange={e => set('address', e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="set-btn-save" disabled={saving}>
          {saving ? <span className="set-spinner" /> : <Save size={14} />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>

      </form>
    </div>
  );
}