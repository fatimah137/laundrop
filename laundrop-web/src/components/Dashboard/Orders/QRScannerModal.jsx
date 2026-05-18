import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, X, Search, CheckCircle, Camera, Upload, StopCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import StatusBadge from '../../shared/StatusBadge';
import './QRScannerModal.css';

const STATUS_FLOW = ['pending', 'pickup', 'proses', 'siap', 'delivery', 'selesai'];

const STATUS_OPTIONS = STATUS_FLOW.map(s => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function QRScannerModal({ orders = [], onStatusChange, onClose }) {
  const [tab, setTab]                 = useState('scan');
  const [scanMode, setScanMode]       = useState('idle'); // 'idle' | 'camera' | 'file'
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder]   = useState(null);
  const [newStatus, setNewStatus]     = useState('');
  const [saved, setSaved]             = useState(false);
  const [cameraError, setCameraError] = useState('');

  const scannerRef  = useRef(null);
  const fileInputRef = useRef(null);
  const SCANNER_ID  = 'qr-camera-region';

  // Cari order berdasarkan QR value
  const findOrder = (qrValue) => {
    const q = qrValue.trim().toLowerCase();
    const found = orders.find(o =>
      o.order_number?.toLowerCase() === q ||
      o.order_number?.toLowerCase().includes(q)
    );
    if (found) {
      setFoundOrder(found);
      const currentIdx = STATUS_FLOW.indexOf(found.status);
      const next = STATUS_FLOW[currentIdx + 1] || found.status;
      setNewStatus(next);
      setSaved(false);
      stopCamera();
    } else {
      setCameraError(`Order "${qrValue}" tidak ditemukan`);
    }
  };

  // Start kamera
  const startCamera = async () => {
    setCameraError('');
    setScanMode('camera');

    // Tunggu DOM render dulu
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => findOrder(decodedText),
          () => {} // ignore errors per frame
        );
      } catch (err) {
        setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
        setScanMode('idle');
      }
    }, 100);
  };

  // Stop kamera
  const stopCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch {}
    setScanMode('idle');
  };

  // Upload file QR
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');
    setScanMode('file');

    try {
      const scanner = new Html5Qrcode('qr-file-region');
      const result  = await scanner.scanFile(file, true);
      findOrder(result);
    } catch {
      setCameraError('QR code tidak terbaca dari file. Coba gambar yang lebih jelas.');
    } finally {
      setScanMode('idle');
      e.target.value = '';
    }
  };

  // Cari manual
  const handleSearch = () => {
    const q = searchQuery.toLowerCase();
    const found = orders.find(o =>
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q)
    );
    if (found) {
      setFoundOrder(found);
      const currentIdx = STATUS_FLOW.indexOf(found.status);
      const next = STATUS_FLOW[currentIdx + 1] || found.status;
      setNewStatus(next);
      setSaved(false);
      setCameraError('');
    } else {
      setCameraError('Order tidak ditemukan');
    }
  };

  // Update status
  const handleUpdate = () => {
    if (!foundOrder || !newStatus) return;
    onStatusChange?.(foundOrder.id, newStatus);
    setSaved(true);
    setTimeout(() => {
      setFoundOrder(null);
      setSearchQuery('');
      setSaved(false);
      setCameraError('');
    }, 1500);
  };

  const resetScan = () => {
    stopCamera();
    setFoundOrder(null);
    setSearchQuery('');
    setCameraError('');
    setSaved(false);
  };

  // Cleanup kamera saat close
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const qrOrders = orders.filter(o =>
    !searchQuery ||
    o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-dialog" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="qr-header">
          <div className="qr-header-left">
            <QrCode size={20} className="qr-header-icon" />
            <div>
              <h2 className="qr-title">QR / Barcode Scanner</h2>
              <p className="qr-subtitle">Scan atau cari order untuk update status laundry</p>
            </div>
          </div>
          <button className="qr-close" onClick={() => { stopCamera(); onClose(); }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="qr-tabs">
          <button
            className={`qr-tab ${tab === 'scan' ? 'active' : ''}`}
            onClick={() => { resetScan(); setTab('scan'); }}
          >
            Scan QR
          </button>
          <button
            className={`qr-tab ${tab === 'list' ? 'active' : ''}`}
            onClick={() => { resetScan(); setTab('list'); }}
          >
            Lihat QR Order
          </button>
        </div>

        <div className="qr-body">

          {tab === 'scan' ? (
            <>
              {!foundOrder && (
                <>
                  {/* Viewfinder kamera */}
                  <div className="qr-viewfinder">
                    <div className="qr-viewfinder-corner tl" />
                    <div className="qr-viewfinder-corner tr" />
                    <div className="qr-viewfinder-corner bl" />
                    <div className="qr-viewfinder-corner br" />

                    {scanMode === 'camera' ? (
                      <div id={SCANNER_ID} className="qr-camera-region" />
                    ) : (
                      <div className="qr-viewfinder-inner">
                        <QrCode size={40} className="qr-viewfinder-icon" />
                        <p className="qr-viewfinder-text">
                          {scanMode === 'file' ? 'Membaca QR dari file...' : 'Pilih metode scan di bawah'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {cameraError && (
                    <div className="qr-error">
                      <X size={14} /> {cameraError}
                    </div>
                  )}

                  {/* Tombol aksi scan */}
                  {scanMode === 'camera' ? (
                    <button className="qr-btn-stop" onClick={stopCamera}>
                      <StopCircle size={16} /> Stop Kamera
                    </button>
                  ) : (
                    <div className="qr-scan-btns">
                      <button className="qr-btn-camera" onClick={startCamera}>
                        <Camera size={16} /> Scan via Kamera
                      </button>
                      <button className="qr-btn-upload" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> Upload Foto QR
                      </button>
                    </div>
                  )}

                  {/* Hidden file input & file scanner region */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="qr-file-hidden"
                    onChange={handleFileUpload}
                  />
                  <div id="qr-file-region" style={{ display: 'none' }} />

                  <div className="qr-divider">atau cari manual</div>

                  {/* Search manual */}
                  <div className="qr-search-wrap">
                    <input
                      className="qr-search-input"
                      placeholder="No. order atau nama customer..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="qr-search-btn" onClick={handleSearch}>
                      <Search size={16} />
                    </button>
                  </div>
                </>
              )}

              {/* Order ditemukan */}
              {foundOrder && (
                <div className="qr-found">
                  {saved ? (
                    <div className="qr-saved">
                      <CheckCircle size={32} className="qr-saved-icon" />
                      <p className="qr-saved-text">Status berhasil diperbarui!</p>
                    </div>
                  ) : (
                    <>
                      <div className="qr-found-card">
                        <p className="qr-found-label">
                          <CheckCircle size={14} /> Order Ditemukan!
                        </p>
                        <div className="qr-found-row">
                          <span className="qr-found-key">Order #</span>
                          <span className="qr-found-val">{foundOrder.order_number}</span>
                        </div>
                        <div className="qr-found-row">
                          <span className="qr-found-key">Customer</span>
                          <span className="qr-found-val">{foundOrder.customer_name}</span>
                        </div>
                        <div className="qr-found-row">
                          <span className="qr-found-key">Service</span>
                          <span className="qr-found-val">{foundOrder.service_name || '-'}</span>
                        </div>
                        <div className="qr-found-row">
                          <span className="qr-found-key">Status saat ini</span>
                          <StatusBadge status={foundOrder.status} />
                        </div>
                      </div>

                      <div className="qr-update-section">
                        <p className="qr-update-label">Update Status ke:</p>
                        <select
                          className="qr-select"
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                        >
                          {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="qr-actions">
                        <button className="qr-btn-cancel" onClick={resetScan}>
                          <X size={14} /> Batal
                        </button>
                        <button className="qr-btn-update" onClick={handleUpdate}>
                          <CheckCircle size={14} /> Perbarui Status
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="qr-search-wrap">
                <input
                  className="qr-search-input"
                  placeholder="Cari order..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="qr-list-search-icon" />
              </div>

              <div className="qr-order-list">
                {qrOrders.map(o => (
                  <div key={o.id} className="qr-order-item">
                    <div className="qr-order-item-left">
                      <p className="qr-order-number">{o.order_number}</p>
                      <p className="qr-order-customer">{o.customer_name}</p>
                    </div>
                    <div className="qr-order-item-right">
                      <StatusBadge status={o.status} />
                      <div className="qr-code-box">
                        <QrCode size={28} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}