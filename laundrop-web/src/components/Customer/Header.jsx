import { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import './Header.css'; // import file CSS-nya

export default function Header({ onMenuClick }) {
  const { currentUser, unreadCount } = useRole();
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    // Get photo from localStorage (where it's saved from profile page)
    const savedPhoto = localStorage.getItem('laundrop_photo');
    setPhoto(savedPhoto);
  }, []);

  const initials = currentUser?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleMenuClick = () => {
    console.log('🍔 Hamburger clicked!');
    onMenuClick();
  };

  return (
    <header className="main-header">
      {/* Tombol Menu untuk Mobile */}
      <button className="mobile-menu-btn" onClick={handleMenuClick}>
        <Menu className="icon" />
      </button>

      {/* Spacer agar elemen kanan tetap di kanan */}
      <div className="header-spacer" />

      <div className="header-right">
        {/* Notifikasi */}
        <Link to="/customer/notification" className="bell-btn">
          <Bell size={20} />
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
        </Link>

        {/* Profil User */}
        <Link to="/customer/profile" className="profile-link">
          <div className="avatar-circle">
            {photo ? (
              <img src={photo} alt={currentUser?.name} className="avatar-photo" />
            ) : (
              <span className="avatar-initials">{initials}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}