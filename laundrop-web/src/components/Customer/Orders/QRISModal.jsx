import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, CheckCircle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import './QRISModal.css';

export default function QRISModal({ order, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 menit dalam detik

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const handleDownloadQR = () => {
    const qrCanvas = document.querySelector('.qris-qr-code svg');
    if (qrCanvas) {
      const url = qrCanvas.parentElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qris-${order?.order_number || order?.id}.png`;
      a.click();
    }
  };

  const formatRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getPaymentDeadline = () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + timeLeft);
    return now.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    }) + ' WIB';
  };

  return createPortal(
    <div className="qris-overlay" onClick={onClose}>
      <div className="qris-dialog" onClick={e => e.stopPropagation()}>

        <div className="qris-header">
          <div>
            <p className="qris-header-label">Metode Pembayaran</p>
            <h2 className="qris-title">QRIS</h2>
          </div>
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
            <div className="qris-container">
              <div className="qris-left">
                <div className="qris-section">
                  <p className="qris-section-label">Scan QR Code</p>
                  <p className="qris-section-hint">Scan dengan aplikasi e-wallet atau m-banking Anda</p>
                </div>

                <div className="qris-timer-section">
                  <p className="qris-timer-label">Sisa Waktu Pembayaran</p>
                  <div className="qris-timer">{formatTime(timeLeft)}</div>
                </div>

                <div className="qris-deadline-section">
                  <p className="qris-deadline-label">Batas Waktu Pembayaran</p>
                  <p className="qris-deadline-text">{getPaymentDeadline()}</p>
                </div>

                <div className="qris-amount-section">
                  <p className="qris-amount-label">Total Pembayaran</p>
                  <p className="qris-amount">{formatRp(order?.price || 0)}</p>
                </div>

                <button className="qris-link-btn" onClick={handleDownloadQR}>
                  <Download size={14} /> Unduh QR Code
                </button>
              </div>

              <div className="qris-right">
                <div className="qris-qr-code">
                  <QRCodeSVG
                    value={`QRIS-PAY-${order?.id}-${order?.price}`}
                    size={200}
                    level="M"
                    includeMargin
                    quietZone={10}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!paid && (
          <div className="qris-footer">
            <button
              className="qris-btn-secondary"
              onClick={handleSimulatePay}
              disabled={loading}
            >
              {loading ? (
                <><span className="qris-spinner" /> Memproses...</>
              ) : (
                'Cek Status Pembayaran'
              )}
            </button>
            <button
              className="qris-btn-secondary-alt"
              onClick={onClose}
            >
              Belanja Lagi
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}