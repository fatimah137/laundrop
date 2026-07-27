import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import { X, Printer, Bluetooth, AlertCircle, Check } from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import './ThermalPrinterModal.css';

const BAUD_RATE_OPTIONS = [9600, 19200, 38400, 57600, 115200];
const THERMAL_MAX_WIDTH = 384;
const THERMAL_PIXEL_RATIO = 3;

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

const concatUint8Arrays = (...arrays) => {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  arrays.forEach((array) => {
    result.set(array, offset);
    offset += array.length;
  });

  return result;
};

const getReadableSerialError = (error) => {
  if (!error) return 'Unknown error';
  if (error?.name === 'InvalidStateError') return 'Port sedang dipakai aplikasi lain atau belum tertutup sempurna.';
  if (error?.name === 'NetworkError') return 'Koneksi ke printer terputus. Cek kabel/Bluetooth printer.';
  if (error?.name === 'NotFoundError') return 'Perangkat printer tidak ditemukan.';
  if (error?.name === 'NotReadableError') return 'Port tidak bisa dibaca. Coba cabut-pasang printer.';
  if (error?.name === 'TypeError') return 'Konfigurasi port tidak sesuai dengan printer.';
  return error?.message || String(error);
};

const writeInChunks = async (writer, bytes, chunkSize = 1024) => {
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.slice(offset, Math.min(offset + chunkSize, bytes.length));
    await writer.write(chunk);
    // Give low-end serial adapters time to flush internal buffer.
    await new Promise((resolve) => window.setTimeout(resolve, 8));
  }
};

const toSelectedDeviceMeta = (port) => {
  const info = typeof port?.getInfo === 'function' ? port.getInfo() : {};
  const infoParts = [];

  if (info?.usbVendorId) {
    infoParts.push(`VID ${info.usbVendorId.toString(16).toUpperCase()}`);
  }
  if (info?.usbProductId) {
    infoParts.push(`PID ${info.usbProductId.toString(16).toUpperCase()}`);
  }

  return {
    id: `${info?.usbVendorId || 'serial'}:${info?.usbProductId || 'port'}`,
    name: infoParts.length > 0 ? infoParts.join(' • ') : 'Port serial printer siap digunakan',
    type: 'serial',
  };
};

const canvasToEscPosRaster = (canvas) => {
  const width = canvas.width;
  const height = canvas.height;
  const bytesPerRow = Math.ceil(width / 8);
  const imageData = canvas.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, width, height);

  if (!imageData) {
    throw new Error('Gagal membaca bitmap preview struk');
  }

  const raster = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = ((y * width) + x) * 4;
      const red = imageData.data[idx];
      const green = imageData.data[idx + 1];
      const blue = imageData.data[idx + 2];
      const alpha = imageData.data[idx + 3];
      const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);
      const isBlack = alpha > 32 && luminance < 205;

      if (isBlack) {
        const byteIndex = (y * bytesPerRow) + Math.floor(x / 8);
        raster[byteIndex] |= (0x80 >> (x % 8));
      }
    }
  }

  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  return concatUint8Arrays(
    new Uint8Array([0x1b, 0x40, 0x1b, 0x61, 0x01]),
    new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]),
    raster,
    new Uint8Array([0x0a, 0x0a, 0x1d, 0x56, 0x42, 0x00])
  );
};

const buildEscPosReceiptFromPreview = async (element) => {
  const canvas = await toCanvas(element, {
    cacheBust: true,
    pixelRatio: THERMAL_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    skipFonts: true,
    style: {
      margin: '0',
      transform: 'none',
    },
  });

  const scale = Math.min(1, THERMAL_MAX_WIDTH / canvas.width);
  const targetWidth = Math.max(1, Math.floor(canvas.width * scale));
  const alignedWidth = Math.ceil(targetWidth / 8) * 8;
  const targetHeight = Math.max(1, Math.floor(canvas.height * scale));

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = alignedWidth;
  resizedCanvas.height = targetHeight;
  const context = resizedCanvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Gagal menyiapkan canvas cetak thermal');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, alignedWidth, targetHeight);
  context.imageSmoothingEnabled = false;
  context.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return canvasToEscPosRaster(resizedCanvas);
};

export default function ThermalPrinterModal({ order, onClose }) {
  const printRef = useRef(null);
  const serialPortRef = useRef(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [printMethod, setPrintMethod] = useState('browser'); // 'browser' or 'bluetooth'
  const [baudRate, setBaudRate] = useState(9600);
  const [printErrorDetail, setPrintErrorDetail] = useState('');

  if (!order) return null;

  // Pick serial port for thermal printer
  const handleBluetoothScan = async () => {
    try {
      setIsScanning(true);
      setConnectionStatus(null);
      setPrintErrorDetail('');

      if (!navigator.serial) {
        setConnectionStatus('error_not_supported');
        return;
      }

      const port = await navigator.serial.requestPort();
      if (port) {
        serialPortRef.current = port;
        setSelectedDevice(toSelectedDeviceMeta(port));
        setConnectionStatus('device_selected');
      }
    } catch (error) {
      if (error.name === 'NotFoundError') {
        setConnectionStatus('error_no_device');
      } else if (error.name === 'NotAllowedError') {
        setConnectionStatus('error_permission');
      } else {
        console.error('Serial port error:', error);
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

  // Direct print via Web Serial + ESC/POS
  const handleBluetoothPrint = async () => {
    let port = serialPortRef.current;
    const previewElement = printRef.current;

    if (!selectedDevice || !port || !previewElement) {
      setConnectionStatus('error_no_selection');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionStatus(null);
      setPrintErrorDetail('');

      // Defensive reset: some adapters keep stale open state after failed jobs.
      if (port.readable || port.writable) {
        try {
          await port.close();
        } catch {
          // ignore close failure here, open below will surface final state
        }
      }

      const serialOptions = {
        baudRate: Number(baudRate),
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      };

      const openPort = async (targetPort) => {
        await targetPort.open(serialOptions);
        return targetPort;
      };

      try {
        port = await openPort(port);
      } catch (openError) {
        const openMsg = String(openError?.message || '');
        const canRetrySelect = openError?.name === 'NetworkError' || openMsg.toLowerCase().includes('failed to open serial port');

        if (!canRetrySelect || !navigator.serial) {
          throw openError;
        }

        // Port handle can become stale on Windows after reconnect/disconnect. Re-select and retry once.
        const reselectedPort = await navigator.serial.requestPort();
        if (!reselectedPort) {
          throw openError;
        }

        serialPortRef.current = reselectedPort;
        setSelectedDevice(toSelectedDeviceMeta(reselectedPort));
        port = await openPort(reselectedPort);
      }

      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error('Port printer tidak bisa ditulis');
      }

      try {
        const bytes = await buildEscPosReceiptFromPreview(previewElement);
        await writeInChunks(writer, bytes);
      } finally {
        writer.releaseLock();
      }

      await port.close();
      setConnectionStatus('print_sent');
    } catch (error) {
      console.error('Serial print error:', error);
      setPrintErrorDetail(getReadableSerialError(error));
      try {
        await serialPortRef.current?.close();
      } catch {
        // ignore close failure
      }
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
            <Bluetooth size={14} /> Direct Thermal
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
                  size={148}
                  level="H"
                  includeMargin={true}
                />
                <div className="thermal-qr-order-number">{order.order_number || 'LAU-001'}</div>
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
              <div className="thermal-config-grid">
                <div className="thermal-config-field">
                  <label className="thermal-config-label">Baud Rate</label>
                  <select
                    className="thermal-config-select"
                    value={baudRate}
                    onChange={(event) => setBaudRate(Number(event.target.value))}
                  >
                    {BAUD_RATE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="thermal-btn-scan"
                onClick={handleBluetoothScan}
                disabled={isScanning}
              >
                <Bluetooth size={16} /> 
                {isScanning ? 'Memilih Port Printer...' : 'Pilih Port Printer'}
              </button>

              {connectionStatus && (
                <div className={`thermal-status thermal-status-${connectionStatus}`}>
                  {connectionStatus === 'device_selected' && (
                    <>
                      <Check size={14} /> Port printer dipilih
                    </>
                  )}
                  {connectionStatus === 'error_not_supported' && (
                    <>
                      <AlertCircle size={14} /> Browser tidak mendukung Web Serial
                    </>
                  )}
                  {connectionStatus === 'error_no_device' && (
                    <>
                      <AlertCircle size={14} /> Tidak ada port printer yang dipilih
                    </>
                  )}
                  {connectionStatus === 'error_permission' && (
                    <>
                      <AlertCircle size={14} /> Akses port printer ditolak
                    </>
                  )}
                  {connectionStatus === 'error_no_selection' && (
                    <>
                      <AlertCircle size={14} /> Pilih port printer terlebih dahulu
                    </>
                  )}
                  {connectionStatus === 'print_sent' && (
                    <>
                      <Check size={14} /> Struk ESC/POS dikirim ke printer
                    </>
                  )}
                  {connectionStatus === 'error_print' && (
                    <>
                      <AlertCircle size={14} /> Gagal mengirim struk ke port printer
                    </>
                  )}
                </div>
              )}

              {printErrorDetail && connectionStatus === 'error_print' && (
                <p className="thermal-hint" style={{ marginTop: 8 }}>
                  Detail: {printErrorDetail}
                </p>
              )}

              <p className="thermal-hint">
                Mode ini akan mencetak raster dari preview struk. Jika hasil terlalu pudar atau terpotong, coba ganti baud rate lalu cetak ulang.
              </p>

              {selectedDevice && (
                <div className="thermal-device-section">
                  <div className="thermal-device-info">
                    <div className="thermal-device-label">Port Terpilih:</div>
                    <div className="thermal-device-name">{selectedDevice.name}</div>
                  </div>
                  <button
                    className="thermal-btn-print"
                    onClick={handleBluetoothPrint}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Mengirim ke Printer...' : 'Cetak ESC/POS'}
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
