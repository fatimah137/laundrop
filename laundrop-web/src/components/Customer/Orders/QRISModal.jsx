import { createPortal } from 'react-dom';
import { useState } from 'react';
import { X, CheckCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import './QRISModal.css';

export default function QRISModal({ order, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid]       = useState(false);

  const handleSimulatePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    }, 2000);
  };

  const formatRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  return createPortal(
    <div className="qris-overlay" onClick={onClose}>
      <div className="qris-dialog" onClick={e => e.stopPropagation()}>

        <div className="qris-header">
          <h2 className="qris-title">Pembayaran QRIS</h2>
          <button className="qris-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="qris-body">
          {paid ? (
            <div className="qris-success">
              <CheckCircle size={48} className="qris-success-icon" />
              <p className="qris-success-title">Pembayaran Berhasil!</p>
              <p className="qris-success-sub">Status pesanan akan diperbarui</p>
            </div>
          ) : (
            <>
              <p className="qris-order-id">{order?.order_number || order?.id}</p>
              <p className="qris-amount">{formatRp(order?.price || 0)}</p>

              {/* QR Code QRIS */}
              <div className="qris-qr-wrap">
                <QRCodeSVG
                  value={`QRIS-PAY-${order?.id}-${order?.price}`}
                  size={180}
                  level="M"
                  includeMargin
                />
              </div>

              <p className="qris-hint">
                Scan QR di atas dengan aplikasi e-wallet atau m-banking Anda
              </p>

              <div className="qris-divider">atau</div>

              <button
                className="qris-btn-simulate"
                onClick={handleSimulatePay}
                disabled={loading}
              >
                {loading ? (
                  <><span className="qris-spinner" /> Memproses...</>
                ) : (
                  <><QrCode size={16} /> Simulasi Bayar</>
                )}
              </button>

              <p className="qris-note">
                * Tombol simulasi hanya untuk demo. Di production, pembayaran otomatis terdeteksi setelah scan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}