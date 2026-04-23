import "./OrderModal.css";

const formatRp = (n) => `Rp ${Number(n).toLocaleString("id-ID")}`;

const TIMELINE_STEPS = [
  { key: "Dijemput",  label: "Pesanan Dijemput",   desc: "Kurir sedang menjemput pakaian Anda"       },
  { key: "Diproses",  label: "Sedang Diproses",     desc: "Pakaian sedang dicuci & disetrika"         },
  { key: "Dikirim",   label: "Dalam Pengiriman",    desc: "Kurir mengantar cucian ke alamat Anda"     },
  { key: "Selesai",   label: "Selesai",             desc: "Cucian telah diterima"                     },
];

function getStepIndex(status) {
  const idx = TIMELINE_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function TrackOrderModal({ order, onClose }) {
  if (!order) return null;

  const activeIdx = getStepIndex(order.status);

  return (
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
          <p className="track-order-id">{order.id}</p>
          <h2 className="track-order-name">{order.service} &nbsp;·&nbsp; {order.weight} kg</h2>
          <div className="track-order-footer">
            <span className="track-status-badge">{order.status}</span>
            <span className="track-price">{formatRp(order.price)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="modal-body">
          <p className="track-section-title">Timeline Pesanan</p>
          <div className="timeline">
            {TIMELINE_STEPS.map((step, i) => {
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
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`t-line ${isDone ? "done" : ""}`} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <p className={`t-title ${isWait ? "muted" : ""}`}>{step.label}</p>
                    <p className="t-desc">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info pesanan */}
          <div className="track-info-box">
            {[
              ["Layanan",       order.service],
              ["Jadwal Jemput", `${order.pickupDate} · ${order.pickupTime}`],
              ["Alamat",        order.pickupAddress],
              ["Pembayaran",    order.paymentMethod],
            ].map(([label, value]) => (
              <div key={label} className="receipt-row">
                <span className="receipt-row-label">{label}</span>
                <span className="receipt-row-value">{value}</span>
              </div>
            ))}
            <div className="receipt-total-row">
              <span className="receipt-total-label">Total</span>
              <span className="receipt-total-val">{formatRp(order.price)}</span>
            </div>
          </div>

          <button className="btn-modal-primary" style={{ width: "100%" }} onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}