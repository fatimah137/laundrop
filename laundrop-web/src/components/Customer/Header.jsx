import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './Header.css'; // import file CSS-nya

export default function Header({ onMenuClick }) {
  const { unreadCount, profile } = useApp();

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
        <button className="bell-btn" onClick={() => navigate('/customer/notifications')}>
          <Bell size={20} />
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
        </button>

        {/* Profil User */}
        <Link to="/customer/profile" className="profile-link">
          <div className="avatar-circle">
            {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
}