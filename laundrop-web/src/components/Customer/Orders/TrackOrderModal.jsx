import { useState } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, X } from 'lucide-react';
import "./OrderModal.css";

const formatRp = (n) => `Rp ${Number(n).toLocaleString("id-ID")}`;

const PICKUP_TIMELINE_STEPS = [
  { key: 'waiting_confirmation', label: 'Menunggu Konfirmasi', desc: 'Admin mengecek slot dan ketersediaan kurir' },
  { key: 'pickup',               label: 'Dalam Penjemputan',   desc: 'Kurir sedang menuju lokasi Anda' },
  { key: 'picked_up',            label: 'Pakaian Diambil',     desc: 'Kurir telah mengambil pakaian Anda' },
  { key: 'waiting_payment',      label: 'Menunggu Pembayaran', desc: 'Tagihan tersedia, menunggu pembayaran' },
  { key: 'washing',              label: 'Proses Pencucian',    desc: 'Pakaian sedang dicuci' },
  { key: 'washing_finished',     label: 'Pencucian Selesai',   desc: 'Pakaian sudah bersih, rapi, dan siap kirim' },
  { key: 'delivery',             label: 'Dalam Pengantaran',   desc: 'Kurir sedang mengantarkan pakaian Anda' },
  { key: 'completed',            label: 'Selesai',             desc: 'Pakaian sudah diterima. Terima kasih!' },
];

const DROP_OFF_TIMELINE_STEPS = [
  { key: 'waiting_confirmation', label: 'Menunggu Konfirmasi', desc: 'Admin mengecek pesanan drop off Anda' },
  { key: 'pickup',               label: 'Menunggu Pakaian di Drop Off', desc: 'Menunggu pelanggan datang ke outlet' },
  { key: 'picked_up',            label: 'Pakaian di Drop Off',  desc: 'Pakaian sudah diterima di outlet' },
  { key: 'waiting_payment',      label: 'Menunggu Pembayaran', desc: 'Tagihan tersedia, menunggu pembayaran' },
  { key: 'washing',              label: 'Proses Pencucian',    desc: 'Pakaian sedang dicuci' },
  { key: 'washing_finished',     label: 'Pencucian Selesai',   desc: 'Pakaian sudah bersih, rapi, dan siap kirim' },
  { key: 'delivery',             label: 'Dalam Pengantaran',   desc: 'Kurir sedang mengantarkan pakaian Anda' },
  { key: 'completed',            label: 'Selesai',             desc: 'Pakaian sudah diterima. Terima kasih!' },
];

const STATUS_LABELS = {
  waiting_confirmation: 'Menunggu Konfirmasi',
  pickup: 'Dalam Penjemputan',
  picked_up: 'Pakaian Diambil',
  waiting_payment: 'Menunggu Pembayaran',
  washing: 'Proses Pencucian',
  washing_finished: 'Pencucian Selesai',
  delivery: 'Dalam Pengantaran',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function formatTimelineDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace('.', '');
}

function normalizeStatus(status, backendStatus) {
  if (backendStatus) return String(backendStatus).toLowerCase();

  const key = String(status || '').toLowerCase();
  const aliasMap = {
    'waiting pickup': 'waiting_confirmation',
    pickup: 'pickup',
    'waiting payment': 'waiting_payment',
    processing: 'washing',
    ready: 'washing_finished',
    delivery: 'delivery',
    completed: 'completed',
    cancelled: 'cancelled',
    pending: 'waiting_confirmation',
    'on progress': 'pickup',
  };

  return aliasMap[key] || key;
}

export default function TrackOrderModal({
  order,
  onClose,
  onPayQris,
  onCancel,
  canCancel = false,
  cancelling = false,
}) {
  const [photoModal, setPhotoModal] = useState(null);

  if (!order) return null;

  const statusKey = normalizeStatus(order.status, order.backend_status);
  const isDropOff = String(order.orderType || order.order_type || '').toLowerCase() === 'drop_off';
  const timelineSteps = isDropOff ? DROP_OFF_TIMELINE_STEPS : PICKUP_TIMELINE_STEPS;
  const statusLogs = Array.isArray(order.status_logs) ? order.status_logs : [];
  const statusTimeMap = statusLogs.reduce((acc, log) => {
    const key = String(log?.status_after || '').toLowerCase();
    if (!key) return acc;
    if (!acc[key]) acc[key] = log?.created_at;
    return acc;
  }, {});
  if (!statusTimeMap.waiting_confirmation) {
    statusTimeMap.waiting_confirmation = order.created_at;
  }

  const pickupProofUrl = order?.photos?.pickup || order?.photo_pickup_url || null;
  const deliveryProofUrl = order?.photos?.delivery || order?.photo_delivery_url || null;
  const scaleProofUrl = order?.photos?.scale || order?.photo_scale_url || null;
  const activeIdx = timelineSteps.findIndex(
    s => s.key.toLowerCase() === (statusKey || '').toLowerCase()
  ) === -1
    ? 0
    : timelineSteps.findIndex(s => s.key.toLowerCase() === (statusKey || '').toLowerCase());

  // ✅ Tampilkan tombol QRIS kalau sudah verified, metode QRIS, belum bayar
  const showQrisBtn =
    typeof onPayQris === 'function' &&
    statusKey === 'waiting_payment' &&
    order.paymentMethod === 'QRIS' &&
    order.payment_status !== 'paid';

  // ✅ Harga: estimasi sebelum verified, final setelah verified
  const displayPrice = order.verified
    ? formatRp(order.price)
    : `~${formatRp(order.estimated_price || order.price)}`;

  const canCancelOrder = typeof onCancel === 'function' && canCancel;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header biru */}
        <div className="track-header">
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <p className="track-order-id">{order.order_number || order.id}</p>
          <h2 className="track-order-name">
            {order.service} &nbsp;·&nbsp; {order.actual_weight || order.weight} kg
          </h2>
          <div className="track-order-footer">
            <span className="track-status-badge">{STATUS_LABELS[statusKey] || order.status}</span>
            <span className="track-price">{displayPrice}</span>
          </div>
        </div>

        <div className="modal-body">

          {/* ✅ QRIS payment alert — muncul kalau perlu bayar */}
          {showQrisBtn && (
            <div className="track-qris-alert">
              <div className="track-qris-alert-left">
                <QrCode size={18} className="track-qris-icon" />
                <div>
                  <p className="track-qris-title">Pembayaran QRIS Diperlukan</p>
                  <p className="track-qris-sub">
                    Selesaikan pembayaran agar laundry mulai diproses
                  </p>
                </div>
              </div>
              <button
                className="track-qris-btn"
                onClick={() => { onClose(); onPayQris?.(order); }}
              >
                Bayar QRIS
              </button>
            </div>
          )}

          {/* Progress bar horizontal */}
          <p className="track-section-title">Timeline Pesanan</p>
          <div className="track-progress-bar">
            <div
              className="track-progress-fill"
              style={{ width: `${(activeIdx / (timelineSteps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="track-progress-labels">
            <span>Menunggu</span>
            <span>Selesai</span>
          </div>

          {/* Timeline vertikal */}
          <div className="timeline">
            {timelineSteps.map((step, i) => {
              const isDone   = i < activeIdx;
              const isActive = i === activeIdx;
              const isWait   = i > activeIdx;
              return (
                <div key={step.key} className="timeline-item">
                  <div className="timeline-left">
                    <div className={`t-circle ${isDone ? "done" : isActive ? "active" : ""}`}>
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : isActive ? (
                        <div className="t-circle-dot" />
                      ) : null}
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`t-line ${isDone ? "done" : ""}`} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <p className={`t-title ${isWait ? "muted" : ""}`}>{step.label}</p>
                    <p className="t-desc">{step.desc}</p>
                    
                    <div className="t-time-row">
                      {statusTimeMap[step.key] && (
                        <p className="t-time">{formatTimelineDateTime(statusTimeMap[step.key])}</p>
                      )}
                      
                      {step.key === 'picked_up' && pickupProofUrl && (
                        <button
                          type="button"
                          className="t-proof-link"
                          onClick={() => setPhotoModal({ url: pickupProofUrl, title: 'Foto Bukti Pengambilan Pakaian' })}
                        >
                          Lihat Foto Bukti
                        </button>
                      )}

                      {step.key === 'waiting_payment' && scaleProofUrl && (
                        <button
                          type="button"
                          className="t-proof-link"
                          onClick={() => setPhotoModal({ url: scaleProofUrl, title: 'Foto Bukti Timbangan' })}
                        >
                          Lihat Foto Bukti
                        </button>
                      )}

                      {step.key === 'completed' && deliveryProofUrl && (
                        <button
                          type="button"
                          className="t-proof-link"
                          onClick={() => setPhotoModal({ url: deliveryProofUrl, title: 'Foto Bukti Serah Terima' })}
                        >
                          Lihat Foto Bukti
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Info pesanan — lengkap dengan status bayar */}
          <div className="track-info-box">
            {[
              ["Layanan",       order.service],
              ["Jadwal Jemput", `${order.pickupDate || order.date} · ${order.pickupTime}`],
              ["Alamat Antar",  order.pickupAddress],
              ["Alamat Kembali", order.deliveryAddress || order.pickupAddress],
            ].map(([label, value]) => (
              <div key={label} className="receipt-row">
                <span className="receipt-row-label">{label}</span>
                <span className="receipt-row-value">{value || '-'}</span>
              </div>
            ))}

            {/* ✅ Berat — tampilkan aktual vs estimasi */}
            <div className="receipt-row">
              <span className="receipt-row-label">Berat</span>
              <span className="receipt-row-value">
                {order.verified && order.actual_weight
                  ? `${order.actual_weight} kg (aktual)`
                  : `${order.weight} kg (estimasi)`
                }
              </span>
            </div>

            {/* ✅ Metode pembayaran */}
            <div className="receipt-row">
              <span className="receipt-row-label">Metode Bayar</span>
              <span className="receipt-row-value">{order.paymentMethod}</span>
            </div>

            {/* ✅ Status pembayaran */}
            <div className="receipt-row">
              <span className="receipt-row-label">Status Bayar</span>
              <span className={`receipt-row-value ${order.payment_status === 'paid' ? 'track-paid' : 'track-unpaid'}`}>
                {order.payment_status === 'paid' ? '✓ Lunas' : '⏳ Belum Bayar'}
              </span>
            </div>

            {/* ✅ Total — estimasi kalau belum verified */}
            <div className="receipt-total-row">
              <span className="receipt-total-label">
                Total {!order.verified && <span className="track-est-label">(estimasi)</span>}
              </span>
              <span className="receipt-total-val">{displayPrice}</span>
            </div>

            {!order.verified && (
              <p className="track-est-note">
                * Harga final ditentukan setelah employee memverifikasi berat aktual
              </p>
            )}
          </div>

          {/* Tombol bawah */}
          <div className="track-bottom-actions">
            {canCancelOrder && (
              <button
                className="track-btn-cancel"
                onClick={() => onCancel?.()}
                disabled={cancelling}
              >
                {cancelling ? 'Membatalkan...' : 'Cancel Order'}
              </button>
            )}
            {showQrisBtn && (
              <button
                className="track-btn-qris"
                onClick={() => { onClose(); onPayQris?.(order); }}
              >
                <QrCode size={15} /> Bayar QRIS Sekarang
              </button>
            )}
            <button
              className="btn-modal-primary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      {/* ✅ Photo Modal */}
      {photoModal && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModal(null)}>
          <div className="photo-modal-box" onClick={e => e.stopPropagation()}>
            <div className="photo-modal-header">
              <h3>{photoModal.title}</h3>
              <button className="photo-modal-close" onClick={() => setPhotoModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="photo-modal-body">
              <img src={photoModal.url} alt={photoModal.title} className="photo-modal-image" />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}