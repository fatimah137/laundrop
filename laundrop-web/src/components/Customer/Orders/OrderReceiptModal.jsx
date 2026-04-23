import "./OrderModal.css";

const formatRp = (n) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function OrderReceiptModal({ order, onClose, onNewOrder, onTrack }) {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header hijau */}
        <div className="receipt-header">
          <div className="receipt-check-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="receipt-title">Pesanan Berhasil!</h2>
          <p className="receipt-subtitle">
            Pesanan Anda <strong>{order.id}</strong> telah dikonfirmasi.<br/>
            Kurir akan segera menjemput sesuai jadwal.
          </p>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* No Pesanan */}
          <div className="receipt-id-box">
            <span className="receipt-id-label">No. Pesanan</span>
            <span className="receipt-id-val">{order.id}</span>
          </div>

          {/* Rincian */}
          <div className="receipt-rows">
            {[
              ["Layanan",        order.service],
              ["Jadwal Jemput",  `${order.pickupDate} · ${order.pickupTime}`],
              ["Berat / Pcs",    `${order.weight} kg`],
              ["Jumlah Pakaian", order.clothesCount ? `${order.clothesCount} pcs` : "-"],
              ["Alamat",         order.pickupAddress],
              ["Pembayaran",     order.paymentMethod],
            ].map(([label, value]) => (
              <div key={label} className="receipt-row">
                <span className="receipt-row-label">{label}</span>
                <span className="receipt-row-value">{value}</span>
              </div>
            ))}

            <div className="receipt-total-row">
              <span className="receipt-total-label">Total Harga</span>
              <span className="receipt-total-val">{formatRp(order.price)}</span>
            </div>
          </div>

          {/* Tombol */}
          <div className="modal-actions">
            <button className="btn-modal-outline" onClick={onClose}>
              Kembali
            </button>
            <button className="btn-modal-secondary" onClick={onNewOrder}>
              Pesan Lagi
            </button>
            <button className="btn-modal-primary" onClick={onTrack}>
              Lacak Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}