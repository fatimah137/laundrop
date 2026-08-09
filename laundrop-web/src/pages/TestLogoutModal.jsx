import { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';

export default function TestLogoutModal() {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Logout Modal Z-Index Fix</h1>
      <p>Logout modal seharusnya di depan (tidak di belakang sidebar)</p>
      
      <button 
        onClick={() => setShowLogout(true)}
        style={{
          padding: '12px 20px',
          fontSize: '16px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Show Logout Modal
      </button>

      {/* Simulate sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '260px',
        height: '100vh',
        background: '#121926',
        zIndex: 1000,
        color: 'white',
        padding: '20px',
        boxSizing: 'border-box',
      }}>
        <h3>Sidebar (z-index: 1000)</h3>
        <p>Logout modal should appear ABOVE this</p>
      </div>

      {/* Logout Modal */}
      {showLogout && createPortal(
        <div className="logout-overlay" onClick={() => setShowLogout(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <LogOut size={32} />
            </div>
            <h3 className="logout-modal-title">Keluar dari Akun?</h3>
            <p className="logout-modal-desc">Apakah Anda yakin ingin keluar?</p>
            <div className="logout-modal-actions">
              <button 
                className="btn-logout-cancel" 
                onClick={() => setShowLogout(false)}
              >
                Batal
              </button>
              <button 
                className="btn-logout-confirm"
                onClick={() => alert('Logged out!')}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .logout-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1002;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .logout-modal {
          background: #fff;
          border-radius: 20px;
          padding: 32px 24px;
          width: 100%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: popIn 0.2s ease;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }

        .logout-modal-icon {
          width: 64px;
          height: 64px;
          background: #fef2f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          margin: 0 auto 16px;
        }

        .logout-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px;
        }

        .logout-modal-desc {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .logout-modal-actions {
          display: flex;
          gap: 12px;
        }

        .btn-logout-cancel {
          flex: 1;
          padding: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: #64748b;
        }

        .btn-logout-cancel:hover {
          background: #f8fafc;
        }

        .btn-logout-confirm {
          flex: 1;
          padding: 12px;
          border: none;
          background: #dc2626;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: #fff;
        }

        .btn-logout-confirm:hover {
          background: #b91c1c;
        }
      `}</style>

      <div style={{ marginTop: '40px', marginLeft: '280px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h3>Z-Index Hierarchy (Fixed):</h3>
        <ul>
          <li>✅ Logout Modal: z-index 1002 (HIGHEST - appears on top)</li>
          <li>Modal Order Detail: z-index 1001</li>
          <li>Sidebar: z-index 1000</li>
          <li>Bottom Navbar: z-index 100</li>
          <li>Top Navbar: z-index 10</li>
        </ul>
      </div>
    </div>
  );
}
