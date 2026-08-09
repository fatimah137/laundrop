import { useState } from 'react';

export default function TestVerificationModal() {
  const [showModal, setShowModal] = useState(true);

  const mockOrderData = {
    orderType: "pickup",
    service: "Laundry Express",
    pickupDate: "09/08/2026",
    pickupTime: "10:00",
    weight: "4 kg",
    pickupAddress: "Jalan Keruing Raya, RW 17, Srondol Wetan, Banyumanik, Kota Semarang, Jawa Tengah, 50259, Indonesia",
    deliveryAddress: "Jalan Mangga Dalam Selatan, RW 02, Srondol Wetan, Banyumanik, Kota Semarang, Jawa Tengah, 50264, Indonesia",
    paymentMethod: "Cash",
    notes: "jangan pakai pemutih",
    total: "Rp 83.000",
  };

  const OUTLET_ADDRESS = "Outlet Laundrop - Tembalang, Semarang";

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Verification Modal - Responsive & Scrollable</h1>
      <p>Test button untuk membuka modal verifikasi pesanan dengan mock data</p>
      
      <button 
        onClick={() => setShowModal(true)}
        style={{
          padding: '12px 20px',
          fontSize: '16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Show Verification Modal
      </button>

      {showModal && (
        <div className="verify-overlay" onClick={() => setShowModal(false)}>
          <div className="verify-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="verify-title">Verifikasi Pesanan</h3>
            <p className="verify-subtitle">Pastikan data order sudah sesuai sebelum dibuat.</p>

            <div className="verify-list">
              <div className="verify-row">
                <span>Jenis Order</span>
                <strong>{mockOrderData.orderType === "pickup" ? "Pickup" : "Drop Off"}</strong>
              </div>
              <div className="verify-row">
                <span>Layanan</span>
                <strong>{mockOrderData.service}</strong>
              </div>
              <div className="verify-row">
                <span>Jadwal Jemput</span>
                <strong>{mockOrderData.pickupDate} · {mockOrderData.pickupTime}</strong>
              </div>
              <div className="verify-row">
                <span>Berat Estimasi</span>
                <strong>{mockOrderData.weight}</strong>
              </div>
              <div className="verify-row">
                <span>Alamat Jemput</span>
                <strong className="verify-address">{mockOrderData.pickupAddress}</strong>
              </div>
              <div className="verify-row">
                <span>Alamat Pengantaran</span>
                <strong className="verify-address">{mockOrderData.deliveryAddress}</strong>
              </div>
              <div className="verify-row">
                <span>Pembayaran</span>
                <strong>{mockOrderData.paymentMethod}</strong>
              </div>
              <div className="verify-row">
                <span>Catatan</span>
                <strong className="verify-notes">{mockOrderData.notes}</strong>
              </div>
              <div className="verify-row verify-total-row">
                <span>Total</span>
                <strong>{mockOrderData.total}</strong>
              </div>
            </div>

            <div className="verify-actions">
              <button 
                type="button" 
                className="verify-btn verify-btn-cancel" 
                onClick={() => setShowModal(false)}
              >
                Cek Lagi
              </button>
              <button 
                type="button" 
                className="verify-btn verify-btn-confirm" 
                onClick={() => alert('Order created!')}
              >
                Ya, Buat Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h3>Test Checklist:</h3>
        <ul>
          <li>✅ Modal should be scrollable when content overflows</li>
          <li>✅ Should NOT fill entire screen on mobile</li>
          <li>✅ Should have max-height constraints (90vh desktop, 80vh tablet, 75vh mobile, 70vh extra-small)</li>
          <li>✅ Should position from top on tablet/mobile (not centered)</li>
          <li>✅ Should have padding-bottom for bottom navbar clearance</li>
          <li>✅ Z-index should be 1001 (above everything)</li>
          <li>✅ Responsive on different screen sizes</li>
          <li>✅ Close button (click overlay) should work</li>
        </ul>
      </div>

      <style>{`
        .verify-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 20px;
          animation: overlayIn 0.2s ease;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .verify-modal {
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
          padding: 20px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .verify-title {
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .verify-subtitle {
          font-size: 13px;
          color: #475569;
          margin-bottom: 16px;
        }

        .verify-list {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .verify-row {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          align-items: flex-start;
          padding: 11px 14px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }

        .verify-row:last-child {
          border-bottom: none;
        }

        .verify-row span {
          color: #64748b;
          flex-shrink: 0;
        }

        .verify-row strong {
          color: #0f172a;
          text-align: right;
          font-weight: 600;
        }

        .verify-address {
          max-width: 70%;
          overflow-wrap: anywhere;
        }

        .verify-notes {
          max-width: 70%;
          overflow-wrap: anywhere;
          font-style: italic;
          color: #475569;
        }

        .verify-total-row {
          background: #eff6ff;
        }

        .verify-total-row strong {
          color: #1d4ed8;
          font-size: 16px;
        }

        .verify-actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .verify-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .verify-btn-cancel {
          background: #f1f5f9;
          color: #334155;
        }

        .verify-btn-confirm {
          background: #2563eb;
          color: #fff;
        }

        .verify-btn-confirm:hover {
          background: #1d4ed8;
        }

        /* RESPONSIVE */
        @media (max-width: 1023px) {
          .verify-overlay {
            padding: 30px 16px 100px 16px;
            align-items: flex-start;
            justify-content: center;
            padding-top: 30px;
          }

          .verify-modal {
            max-width: 100%;
            max-height: 80vh;
          }
        }

        @media (max-width: 640px) {
          .verify-overlay {
            padding: 20px 12px 100px 12px;
            align-items: flex-start;
            justify-content: center;
            padding-top: 20px;
          }

          .verify-modal {
            max-width: 100%;
            max-height: 75vh;
            border-radius: 20px;
          }

          .verify-title {
            font-size: 16px;
          }

          .verify-subtitle {
            font-size: 12px;
            margin-bottom: 14px;
          }

          .verify-row {
            padding: 10px 12px;
            font-size: 12px;
          }

          .verify-total-row strong {
            font-size: 14px;
          }

          .verify-actions {
            margin-top: 14px;
            gap: 8px;
          }

          .verify-btn {
            padding: 9px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .verify-overlay {
            padding: 10px 10px 90px 10px;
            align-items: flex-start;
            justify-content: center;
            padding-top: 15px;
          }

          .verify-modal {
            max-height: 70vh;
            border-radius: 16px;
            padding: 16px;
          }

          .verify-title {
            font-size: 15px;
            margin-bottom: 4px;
          }

          .verify-subtitle {
            font-size: 11px;
            margin-bottom: 12px;
          }

          .verify-list {
            border-radius: 10px;
          }

          .verify-row {
            padding: 9px 10px;
            font-size: 11px;
            flex-direction: column;
            gap: 4px;
          }

          .verify-row span {
            color: #64748b;
          }

          .verify-row strong {
            text-align: left;
            font-size: 12px;
          }

          .verify-address {
            max-width: 100%;
          }

          .verify-notes {
            max-width: 100%;
          }

          .verify-total-row strong {
            font-size: 13px;
          }

          .verify-actions {
            margin-top: 12px;
            gap: 6px;
            flex-wrap: wrap;
          }

          .verify-btn {
            flex: 1;
            min-width: 100px;
            padding: 8px 10px;
            font-size: 11px;
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}
