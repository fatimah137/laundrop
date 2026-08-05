import { useState } from 'react';
import { Bell, Mail, MapPin } from 'lucide-react';
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
    emailNotif: true,
    savedAddresses: true,
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
            icon={Mail}
            title="Email Notifications"
            description="Terima update status laundry via email."
            checked={settings.emailNotif}
            onChange={update('emailNotif')}
          />

          <SettingItem
            icon={MapPin}
            title="Saved Addresses"
            description="Simpan alamat rumah, kantor, dan tempat lainnya."
            checked={settings.savedAddresses}
            onChange={update('savedAddresses')}
          />
        </div>
      </div>
    </Layout>
  );
}
