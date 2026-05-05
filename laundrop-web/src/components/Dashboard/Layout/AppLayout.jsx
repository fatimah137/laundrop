import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useRole } from '../../../context/RoleContext'; // ✅ tambah ini
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AppLayout.css';

export default function AppLayout() { // ✅ hapus prop role
  const { role, currentUser } = useRole(); // ✅ ambil dari context
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">

      <div className="sidebar-desktop">
        <Sidebar role={role} /> {/* ✅ kirim role dari context */}
      </div>

      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`sidebar-mobile ${mobileOpen ? 'open' : ''}`}>
        <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="app-main">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          role={role}
          currentUser={currentUser} // ✅ data asli dari login
          unreadCount={3}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

    </div>
  );
}