import { useState } from 'react';
import { Bell, Shield, Globe } from 'lucide-react';
import Layout from '../../../components/Customer/Layout';
import './Settings.css';

function SettingItem({ icon: Icon, title, description, checked, onChange }) {
  return (
    <label className="cus-set-item">
      <div className="cus-set-item-left">
        <span className="cus-set-icon"><Icon size={16} /></span>
        <div>
          <p className="cus-set-title">{title}</p>
          <p className="cus-set-desc">{description}</p>
        </div>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    pushNotif: true,
    promoNotif: false,
    publicProfile: false,
  });

  const update = (key) => (e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }));

  return (
    <Layout>
      <div className="cus-set-page">
        <div className="cus-set-header">
          <h2>Customer Settings</h2>
          <p>Atur preferensi akun Anda di sini.</p>
        </div>

        <div className="cus-set-card">
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            description="Terima update status laundry secara real-time."
            checked={settings.pushNotif}
            onChange={update('pushNotif')}
          />

          <SettingItem
            icon={Globe}
            title="Promo Notifications"
            description="Terima info promo dan diskon terbaru."
            checked={settings.promoNotif}
            onChange={update('promoNotif')}
          />

          <SettingItem
            icon={Shield}
            title="Public Profile"
            description="Tampilkan nama profil di halaman komunitas."
            checked={settings.publicProfile}
            onChange={update('publicProfile')}
          />
        </div>
      </div>
    </Layout>
  );
}
