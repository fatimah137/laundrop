import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AppLayout.css';

const OWNER_USER = {
  name:  'Admin Owner',
  email: 'owner@laundrop.com',
};

const EMPLOYEE_USER = {
  name:  'Karyawan',
  email: 'employee@laundrop.com',
};

export default function AppLayout({ role = 'owner' }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentUser = role === 'owner' ? OWNER_USER : EMPLOYEE_USER;

  return (
    <div className="app-layout">

      {/* Sidebar Desktop */}
      <div className="sidebar-desktop">
        <Sidebar role={role} />
      </div>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Mobile */}
      <div className={`sidebar-mobile ${mobileOpen ? 'open' : ''}`}>
        <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Konten Utama */}
      <div className="app-main">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          role={role}
          currentUser={currentUser}
          unreadCount={3}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

    </div>
  );
}