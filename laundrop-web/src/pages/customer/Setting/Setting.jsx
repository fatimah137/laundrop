import { useState } from 'react';
import { Moon, Sun, Bell, Globe, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import Layout from '../../../components/Customer/Layout';
import './Setting.css';

function Toggle({ checked, onChange }) {
  return (
    <button
      className={`toggle-btn ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`toggle-thumb ${checked ? 'on' : ''}`} />
    </button>
  );
}

function SettingRow({ icon: Icon, label, desc, children, danger }) {
  return (
    <div className={`setting-row ${danger ? 'danger' : ''}`}>
      <div className="setting-row-left">
        <div className={`setting-icon ${danger ? 'danger' : ''}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className={`setting-label ${danger ? 'danger' : ''}`}>{label}</p>
          {desc && <p className="setting-desc">{desc}</p>}
        </div>
      </div>
      <div className="setting-row-right">
        {children}
      </div>
    </div>
  );
}

const LANGUAGES = ['English', 'Bahasa Indonesia'];

export default function Settings() {
  const { settings, updateSettings } = useApp();

  // fallback jika settings belum ada di context
  const [localSettings, setLocalSettings] = useState({
    darkMode:      false,
    notifications: true,
    language:      'English',
  });

  const current  = settings || localSettings;
  const setVal   = (key, val) => {
    if (updateSettings) {
      updateSettings({ [key]: val });
    } else {
      setLocalSettings(prev => ({ ...prev, [key]: val }));
    }
  };

  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Customize your Laundrop experience.</p>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <p className="settings-section-label">Appearance</p>
          <SettingRow
            icon={current.darkMode ? Moon : Sun}
            label="Dark Mode"
            desc={current.darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
          >
            <Toggle
              checked={current.darkMode}
              onChange={v => setVal('darkMode', v)}
            />
          </SettingRow>
        </div>

        {/* Preferences */}
        <div className="settings-card">
          <p className="settings-section-label">Preferences</p>
          <SettingRow
            icon={Bell}
            label="Notifications"
            desc="Order updates & promotions"
          >
            <Toggle
              checked={current.notifications}
              onChange={v => setVal('notifications', v)}
            />
          </SettingRow>
          <SettingRow
            icon={Globe}
            label="Language"
            desc="Select display language"
          >
            <select
              className="settings-select"
              value={current.language}
              onChange={e => setVal('language', e.target.value)}
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </SettingRow>
        </div>

        {/* Account */}
        <div className="settings-card">
          <p className="settings-section-label">Account</p>
          <button
            className="logout-btn"
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            <SettingRow
              icon={LogOut}
              label="Log Out"
              desc="Clear session & data"
              danger
            >
              <ChevronRight size={16} className="chevron-danger" />
            </SettingRow>
          </button>
        </div>

      </div>
    </Layout>
  );
}