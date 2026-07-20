import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import { X, Printer, Bluetooth, AlertCircle, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../../shared/StatusBadge';
import './ThermalPrinterModal.css';

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

export default function ThermalPrinterModal({ order, onClose }) {
  const printRef = useRef(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [printMethod, setPrintMethod] = useState('browser'); // 'browser' or 'bluetooth'

  if (!order) return null;

  // Scan for Bluetooth devices
  const handleBluetoothScan = async () => {
    try {
      setIsScanning(true);
      setConnectionStatus(null);

      // Check if Bluetooth is supported
      if (!navigator.bluetooth) {
        setConnectionStatus('error_not_supported');
        return;
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: /.*printer.*/i },
          { name: /.*thermal.*/i },
          { name: /.*POS.*/i },
        ],
        optionalServices: ['generic_access'],
      });

      if (device) {
        setSelectedDevice({ id: device.id, name: device.name, type: 'bluetooth' });
        setConnectionStatus('device_selected');
      }
    } catch (error) {
      if (error.name === 'NotFoundError') {
        setConnectionStatus('error_no_device');
      } else if (error.name === 'NotAllowedError') {
        setConnectionStatus('error_permission');
      } else {
        console.error('Bluetooth error:', error);
        setConnectionStatus('error_unknown');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Print via browser
  const handleBrowserPrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Struk ${order.order_number}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Courier New', monospace; 
              padding: 16px; 
              color: #000;
              width: 58mm;
              max-width: 58mm;
            }
            .thermal-print-wrap { 
              width: 100%;
              text-align: center;
            }
            .thermal-header { 
              text-align: center; 
              margin-bottom: 16px;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
            }
            .thermal-brand { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 4px;
            }
            .thermal-tagline { 
              font-size: 10px; 
              margin-bottom: 8px;
            }
            .thermal-order-id { 
              font-size: 12px; 
              font-weight: bold; 
              margin-bottom: 4px;
            }
            .thermal-divider { 
              border: none; 
              border-top: 1px dashed #000; 
              margin: 8px 0;
            }
            .thermal-row { 
              display: flex; 
              justify-content: space-between; 
              font-size: 11px;
              margin: 4px 0;
            }
            .thermal-row-label { 
              text-align: left;
              flex: 1;
            }
            .thermal-row-value { 
              text-align: right;
              flex: 1;
            }
            .thermal-total-row { 
              display: flex; 
              justify-content: space-between; 
              font-size: 12px; 
              font-weight: bold; 
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 4px 0;
              margin-top: 8px;
            }
            .thermal-qr-section { 
              text-align: center; 
              margin-top: 12px;
            }
            .thermal-qr-label { 
              font-size: 9px; 
              margin-top: 4px;
            }
            .thermal-footer { 
              text-align: center; 
              font-size: 9px; 
              margin-top: 12px;
              border-top: 1px dashed #000;
              padding-top: 8px;
            }
            @media print {
              body { width: 58mm; }
            }
          </style>
        </head>
        <body>
          <div class="thermal-print-wrap">${content}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { 
      win.print(); 
      win.close(); 
    }, 300);
  };

  // Mock print via Bluetooth (real implementation would need ESC/POS protocol)
  const handleBluetoothPrint = async () => {
    if (!selectedDevice) {
      setConnectionStatus('error_no_selection');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionStatus(null);

      // For now, show browser print as a fallback
      // Real implementation would:
      // 1. Connect to Bluetooth device
      // 2. Convert receipt to ESC/POS commands
      // 3. Send to printer
      alert(`Akan mengirim ke printer: ${selectedDevice.name}\n(Fitur lengkap memerlukan driver printer khusus)`);
      handleBrowserPrint();
      setConnectionStatus('print_sent');
    } catch (error) {
      console.error('Bluetooth print error:', error);
      setConnectionStatus('error_print');
    } finally {
      setIsConnecting(false);
    }
  };

  const rows = [
    { label: 'Jadwal Jemput', value: formatPickupSchedule(order.pickup_date, order.pickup_time) },
    { label: 'Customer',   value: order.customer_name || '-' },
    { label: 'No. HP',     value: order.customer_phone || '-' },
    { label: 'Alamat',     value: order.address || '-' },
    { label: 'Layanan',    value: order.service_name || '-' },
    { label: 'Berat',      value: order.weight ? `${order.weight} kg` : (order.total_clothes ? `${order.total_clothes} pcs` : '-') },
    { label: 'Karyawan',   value: order.assigned_employee || '-' },
    { label: 'Pembayaran', value: (order.payment_method || 'cash').toUpperCase() },
  ];

  return createPortal(
    <div className="thermal-overlay" onClick={onClose}>
      <div className="thermal-dialog" onClick={e => e.stopPropagation()}>

        {/* Dialog Header */}
        <div className="thermal-dialog-header">
          <h2 className="thermal-dialog-title">Struk Thermal</h2>
          <button className="thermal-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="thermal-tabs">
          <button
            className={`thermal-tab ${printMethod === 'browser' ? 'active' : ''}`}
            onClick={() => setPrintMethod('browser')}
          >
            <Printer size={14} /> Print Browser
          </button>
          <button
            className={`thermal-tab ${printMethod === 'bluetooth' ? 'active' : ''}`}
            onClick={() => setPrintMethod('bluetooth')}
          >
            <Bluetooth size={14} /> Bluetooth
          </button>
        </div>

        <div className="thermal-body">

          {/* Preview section */}
          <div className="thermal-preview-section">
            <div className="thermal-preview-label">Preview Struk (58mm)</div>
            <div className="thermal-preview" ref={printRef}>
              {/* Brand header */}
              <div className="thermal-header">
                <div className="thermal-brand">LAUNDROP</div>
                <div className="thermal-tagline">Bersih, Cepat, Terpercaya</div>
                <div className="thermal-order-id">{order.order_number}</div>
              </div>

              <hr className="thermal-divider" />

              {/* Detail rows */}
              {rows.map(({ label, value }) => (
                <div key={label} className="thermal-row">
                  <span className="thermal-row-label">{label}</span>
                  <span className="thermal-row-value">{value}</span>
                </div>
              ))}

              <hr className="thermal-divider" />

              {/* Total */}
              <div className="thermal-total-row">
                <span>TOTAL</span>
                <span>{formatIDR(order.total_amount)}</span>
              </div>

              {/* QR Code */}
              <div className="thermal-qr-section">
                <QRCodeSVG
                  value={order.order_number || 'LAU-001'}
                  size={100}
                  level="H"
                  includeMargin={true}
                />
                <div className="thermal-qr-label">Scan untuk tracking</div>
              </div>

              <div className="thermal-footer">
                Terima kasih atas pemesanan Anda!
              </div>
            </div>
          </div>

          {/* Print method section */}
          {printMethod === 'browser' && (
            <div className="thermal-action-section">
              <button
                className="thermal-btn-print"
                onClick={handleBrowserPrint}
              >
                <Printer size={16} /> Print dengan Browser
              </button>
              <p className="thermal-hint">Pilih printer thermal Anda di dialog print</p>
            </div>
          )}

          {printMethod === 'bluetooth' && (
            <div className="thermal-action-section">
              <button
                className="thermal-btn-scan"
                onClick={handleBluetoothScan}
                disabled={isScanning}
              >
                <Bluetooth size={16} /> 
                {isScanning ? 'Mencari Perangkat...' : 'Cari Perangkat Bluetooth'}
              </button>

              {connectionStatus && (
                <div className={`thermal-status thermal-status-${connectionStatus}`}>
                  {connectionStatus === 'device_selected' && (
                    <>
                      <Check size={14} /> Perangkat ditemukan
                    </>
                  )}
                  {connectionStatus === 'error_not_supported' && (
                    <>
                      <AlertCircle size={14} /> Browser tidak mendukung Bluetooth
                    </>
                  )}
                  {connectionStatus === 'error_no_device' && (
                    <>
                      <AlertCircle size={14} /> Tidak ada perangkat ditemukan
                    </>
                  )}
                  {connectionStatus === 'error_permission' && (
                    <>
                      <AlertCircle size={14} /> Akses Bluetooth ditolak
                    </>
                  )}
                  {connectionStatus === 'print_sent' && (
                    <>
                      <Check size={14} /> Struk dikirim ke printer
                    </>
                  )}
                </div>
              )}

              {selectedDevice && (
                <div className="thermal-device-section">
                  <div className="thermal-device-info">
                    <div className="thermal-device-label">Perangkat Terpilih:</div>
                    <div className="thermal-device-name">{selectedDevice.name}</div>
                  </div>
                  <button
                    className="thermal-btn-print"
                    onClick={handleBluetoothPrint}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Menghubungkan...' : 'Cetak ke Bluetooth'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
