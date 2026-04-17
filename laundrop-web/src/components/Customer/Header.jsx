import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './Header.css'; // import file CSS-nya

export default function Header({ onMenuClick }) {
  const { unreadCount } = useApp();

  return (
    <header className="main-header">
      {/* Tombol Menu untuk Mobile */}
      <button className="mobile-menu-btn" onClick={onMenuClick}>
        <Menu className="icon" />
      </button>

      {/* Spacer agar elemen kanan tetap di kanan */}
      <div className="header-spacer" />

      <div className="header-right">
        {/* Notifikasi */}
        <Link to="/notifications" className="notif-link">
          <Bell className="icon" />
          {unreadCount > 0 && <span className="notif-dot" />}
        </Link>

        {/* Profil User */}
        <Link to="/profile" className="profile-link">
          <div className="avatar-circle">
            AJ
          </div>
        </Link>
      </div>
    </header>
  );
}