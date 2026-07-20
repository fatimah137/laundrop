import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { X, Printer, Waves } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../../shared/StatusBadge';
import './InvoiceModal.css';

const formatIDR = (n) =>
  'Rp ' + (n || 0).toLocaleString('id-ID');

const formatPickupSchedule = (pickupDate, pickupTime) => {
  if (!pickupDate && !pickupTime) return '-';

  const datePart = pickupDate
    ? new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(pickupDate))
    : '';

  const timePart = pickupTime ? String(pickupTime).slice(0, 5) : '';

  if (datePart && timePart) return `${datePart} ${timePart}`;
  return datePart || timePart || '-';
};

export default function InvoiceModal({ order, onClose }) {
  const printRef = useRef(null);

  if (!order) return null;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Invoice ${order.order_number}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1e293b; }
            .inv-print-wrap { max-width: 420px; margin: 0 auto; }
            .inv-header { text-align: center; margin-bottom: 24px; }
            .inv-logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
            .inv-brand { font-size: 22px; font-weight: 800; color: #1e293b; }
            .inv-tagline { font-size: 12px; color: #94a3b8; }
            .inv-order-id { font-size: 13px; font-weight: 700; color: #2563eb; margin: 12px 0 4px; }
            .inv-divider { border: none; border-top: 1px dashed #e2e8f0; margin: 16px 0; }
            .inv-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
            .inv-row-label { color: #64748b; }
            .inv-row-value { font-weight: 500; color: #1e293b; text-align: right; }
            .inv-total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; font-weight: 700; border-top: 2px solid #e2e8f0; margin-top: 8px; }
            .inv-qr-section { text-align: center; margin-top: 24px; }
            .inv-qr-label { font-size: 11px; color: #94a3b8; margin-top: 8px; }
            .inv-footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="inv-print-wrap">${content}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const rows = [
    { label: 'Jadwal Jemput', value: formatPickupSchedule(order.pickup_date, order.pickup_time) },
    { label: 'Customer',  value: order.customer_name || '-' },
    { label: 'No. HP',    value: order.customer_phone || '-' },
    { label: 'Alamat',    value: order.address || '-' },
    { label: 'Layanan',   value: order.service_name || '-' },
    { label: 'Berat',     value: order.weight ? `${order.weight} kg` : (order.total_clothes ? `${order.total_clothes} pcs` : '-') },
    { label: 'Karyawan',  value: order.assigned_employee || '-' },
    { label: 'Pembayaran',value: (order.payment_method || 'cash').toUpperCase() },
  ];

  return createPortal(
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-dialog" onClick={e => e.stopPropagation()}>

        {/* Dialog Header */}
        <div className="inv-dialog-header">
          <h2 className="inv-dialog-title">Invoice / Struk</h2>
          <div className="inv-dialog-actions">
            <button className="inv-btn-print" onClick={handlePrint}>
              <Printer size={15} /> Print
            </button>
            <button className="inv-btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable area */}
        <div className="inv-body" ref={printRef}>

          {/* Brand header */}
          <div className="inv-header">
            <div className="inv-logo-row">
              <div className="inv-logo-icon"><Waves size={18} /></div>
              <span className="inv-brand">Laundrop</span>
            </div>
            <p className="inv-tagline">Bersih, Cepat, Terpercaya</p>
            <p className="inv-order-id">{order.order_number}</p>
            <div className="inv-status-row">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.payment_status || 'unpaid'} type="payment" />
            </div>
          </div>

          <hr className="inv-divider" />

          {/* Detail rows */}
          <div className="inv-rows">
            {rows.map(({ label, value }) => (
              <div key={label} className="inv-row">
                <span className="inv-row-label">{label}</span>
                <span className="inv-row-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="inv-total-row">
            <span>Total</span>
            <span className="inv-total-value">{formatIDR(order.total_amount)}</span>
          </div>

          <hr className="inv-divider" />

          {/* QR Code */}
          <div className="inv-qr-section">
            <p className="inv-qr-title">Scan untuk cek status pesanan</p>
            <div className="inv-qr-wrap">
              <QRCodeSVG
                value={order.order_number || order.order_id || 'unknown'}
                size={140}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="inv-qr-sub">
              Customer dapat scan QR ini untuk memantau status laundry.
              Employee dapat scan untuk update status pesanan.
            </p>
          </div>

          <hr className="inv-divider" />

          {/* Footer */}
          <p className="inv-footer">
            Terima kasih telah menggunakan Laundrop 🙏
          </p>

        </div>
      </div>
    </div>,
    document.body
  );
}