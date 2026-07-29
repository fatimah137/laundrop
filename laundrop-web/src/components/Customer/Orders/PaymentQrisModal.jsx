import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import './OrderModal.css';

export default function PaymentQrisModal({ order, onClose, onPaymentSuccess }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [pollingActive, setPollingActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 menit dalam detik

  // Generate QRIS saat modal dibuka
  useEffect(() => {
    generateQris();
  }, [order?.id]);

  // Timer countdown
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

  // Polling untuk check payment status
  useEffect(() => {
    if (!pollingActive || !order?.id || !qrData) return;

    const pollInterval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Poll setiap 5 detik

    return () => clearInterval(pollInterval);
  }, [pollingActive, order?.id, qrData]);

  const generateQris = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/orders/${order.id}/generate-qris`);

      if (response.data?.success) {
        setQrData(response.data.data);
        setPaymentStatus('pending');
      } else {
        setError(response.data?.message || 'Gagal generate QRIS');
      }
    } catch (err) {
      console.error('Generate QRIS error:', err);
      
      // Fallback dengan mock data untuk testing UI
      console.log('Menggunakan mock data untuk testing...');
      const mockQrData = {
        qr_string: `QRIS-PAY-${order?.id}-${order?.price || 18000}`,
        gross_amount: order?.price || 18000,
        expires_in: '30 menit',
        transaction_id: `TXN-${Date.now()}`,
      };
      setQrData(mockQrData);
      setPaymentStatus('pending');
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/orders/${order.id}/payment-status`);

      if (response.data?.success) {
        const data = response.data.data;
        setPaymentStatus(data.transaction_status);

        // Jika pembayaran sukses
        if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
          setPollingActive(false);
          
          // Tunggu 2 detik baru close/callback
          setTimeout(() => {
            if (onPaymentSuccess) {
              onPaymentSuccess(data);
            } else {
              onClose();
            }
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Check payment status error:', err);
      // Jangan set error untuk polling failures — ini normal kalau connection issue
    }
  };

  const handleDownloadQR = () => {
    const qrCanvas = document.querySelector('.payment-qr-code svg');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-qris-new" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="payment-qris-header">
          <div>
            <p className="payment-qris-header-label">Metode Pembayaran</p>
            <h2 className="payment-qris-title">QRIS</h2>
          </div>
          <button className="payment-qris-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body payment-qris-body">
          {loading ? (
            <div className="payment-loading">
              <div className="payment-spinner"></div>
              <p>Membuat kode QRIS...</p>
            </div>
          ) : error ? (
            <div className="payment-error">
              <p className="error-msg">{error}</p>
              <p className="error-hint">Menggunakan data simulasi untuk testing</p>
              <button onClick={generateQris} className="btn-retry-qris">Coba Lagi</button>
            </div>
          ) : paymentStatus === 'settlement' || paymentStatus === 'capture' ? (
            <div className="payment-success">
              <CheckCircle2 size={48} className="payment-success-icon" />
              <p className="payment-success-title">Pembayaran Berhasil!</p>
              <p className="payment-success-sub">Status pesanan akan diperbarui</p>
            </div>
          ) : qrData && paymentStatus === 'pending' ? (
            <div className="payment-qris-container">
              <div className="payment-qris-left">
                <div className="payment-qris-section">
                  <p className="payment-qris-section-label">Scan QR Code</p>
                  <p className="payment-qris-section-hint">Scan dengan aplikasi e-wallet atau m-banking Anda</p>
                </div>

                <div className="payment-qris-timer-section">
                  <p className="payment-qris-timer-label">Sisa Waktu Pembayaran</p>
                  <div className="payment-qris-timer">{formatTime(timeLeft)}</div>
                </div>

                <div className="payment-qris-deadline-section">
                  <p className="payment-qris-deadline-label">Batas Waktu Pembayaran</p>
                  <p className="payment-qris-deadline-text">{getPaymentDeadline()}</p>
                </div>

                <div className="payment-qris-amount-section">
                  <p className="payment-qris-amount-label">Total Pembayaran</p>
                  <p className="payment-qris-amount">{formatRp(qrData.gross_amount || 0)}</p>
                </div>

                <button className="payment-qris-link-btn" onClick={handleDownloadQR}>
                  <Download size={14} /> Unduh QR Code
                </button>
              </div>

              <div className="payment-qris-right">
                <div className="payment-qr-code">
                  <QRCodeSVG
                    value={qrData.qr_string || ''}
                    size={200}
                    level="H"
                    includeMargin
                    quietZone={10}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && qrData && paymentStatus === 'pending' && (
          <div className="payment-qris-footer">
            <button
              className="payment-qris-btn-primary"
              onClick={checkPaymentStatus}
            >
              Cek Status Pembayaran
            </button>
            <button
              className="payment-qris-btn-secondary"
              onClick={onClose}
            >
              Belanja Lagi
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-qris-new {
          max-width: 700px;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          overflow: hidden;
        }

        .payment-qris-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .payment-qris-header-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .payment-qris-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .payment-qris-close {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: background 0.15s;
          margin-top: -4px;
        }

        .payment-qris-close:hover {
          background: #f3f4f6;
        }

        .payment-qris-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .payment-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 24px;
        }

        .payment-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .payment-error {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .error-msg {
          color: #7f1d1d;
          font-weight: 500;
          margin: 0 0 8px;
        }

        .error-hint {
          color: #9a4949;
          font-size: 12px;
          margin: 0 0 12px;
          font-style: italic;
        }

        .btn-retry-qris {
          padding: 10px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-retry-qris:hover {
          background: #b91c1c;
        }

        .payment-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 24px;
        }

        .payment-success-icon {
          color: #16a34a;
          width: 48px;
          height: 48px;
        }

        .payment-success-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .payment-success-sub {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .payment-qris-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .payment-qris-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .payment-qris-section {
          text-align: left;
        }

        .payment-qris-section-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .payment-qris-section-hint {
          font-size: 13px;
          color: #374151;
          margin: 0;
          line-height: 1.5;
        }

        .payment-qris-timer-section {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }

        .payment-qris-timer-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .payment-qris-timer {
          font-size: 28px;
          font-weight: 800;
          color: #dc2626;
          margin: 0;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }

        .payment-qris-deadline-section {
          text-align: left;
        }

        .payment-qris-deadline-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .payment-qris-deadline-text {
          font-size: 13px;
          color: #374151;
          margin: 0;
        }

        .payment-qris-amount-section {
          background: #f0f9ff;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          border: 1px solid #bfdbfe;
        }

        .payment-qris-amount-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .payment-qris-amount {
          font-size: 24px;
          font-weight: 800;
          color: #1e40af;
          margin: 0;
        }

        .payment-qris-link-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: auto;
        }

        .payment-qris-link-btn:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .payment-qris-right {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          min-height: 280px;
        }

        .payment-qr-code {
          background: #fff;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .payment-qr-code svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .payment-qris-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .payment-qris-btn-primary,
        .payment-qris-btn-secondary {
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .payment-qris-btn-primary {
          background: #2563eb;
          color: #fff;
        }

        .payment-qris-btn-primary:hover {
          background: #1d4ed8;
        }

        .payment-qris-btn-secondary {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .payment-qris-btn-secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .modal-qris-new {
            max-width: 100%;
          }

          .payment-qris-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .payment-qris-right {
            min-height: 250px;
          }

          .payment-qris-footer {
            grid-template-columns: 1fr;
          }

          .payment-qris-timer {
            font-size: 24px;
          }

          .payment-qris-amount {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
