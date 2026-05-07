import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ onMenuClick, role = 'owner', currentUser, unreadCount = 0 }) {
  const [searchValue, setSearchValue] = useState('');

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'U';

  return (
    <header className="owner-topbar">

      {/* Tombol Menu Mobile */}
      <button className="topbar-menu-btn" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="topbar-spacer" />

      <div className="topbar-right">

        {/* Notifikasi */}
        <Link to={`/${role}/notifications`} className="topbar-bell-btn">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="topbar-bell-badge" />
          )}
        </Link>

        {/* User Info */}
        <div className="topbar-user">
          <div className="topbar-avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="topbar-user-info">
            <p className="topbar-user-name">{currentUser?.name || 'User'}</p>
            <p className="topbar-user-role">{role}</p>
          </div>
        </div>

      </div>
    </header>
  );
}