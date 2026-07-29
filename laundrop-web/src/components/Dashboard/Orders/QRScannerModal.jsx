import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, X, Search, CheckCircle, Camera, Upload, StopCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import StatusBadge from '../../shared/StatusBadge';
import './QRScannerModal.css';

const STATUS_FLOW = [
  'waiting_confirmation',
  'pickup',
  'picked_up',
  'waiting_payment',
  'washing',
  'washing_finished',
  'delivery',
  'completed',
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
};

const STATUS_OPTIONS = STATUS_FLOW.map((s) => ({
  value: s,
  label: STATUS_LABELS[s] || s,
}));

const CAMERA_SCAN_CONFIG = { fps: 10, qrbox: { width: 240, height: 240 } };

const pickPreferredCamera = (devices = []) => {
  if (!Array.isArray(devices) || devices.length === 0) return null;

  const rearCamera = devices.find((device) => {
    const label = String(device?.label || '').toLowerCase();
    return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('belakang');
  });

  return rearCamera || devices[0];
};

export default function QRScannerModal({ orders = [], onStatusChange, onClose }) {
  const [tab, setTab] = useState('scan');
  const [scanMode, setScanMode] = useState('idle'); // 'idle' | 'camera' | 'file'
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerEngine, setScannerEngine] = useState('native'); // 'native' | 'html5'

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const html5ScannerRef = useRef(null);

  const getAvailableCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        setSelectedCameraId((prev) => {
          if (prev && devices.some((d) => d.id === prev)) return prev;
          return pickPreferredCamera(devices)?.id || devices[0].id;
        });
      }
    } catch (err) {
      console.error('[QRScanner] Error getting cameras:', err);
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  };

  const ensureBarcodeDetector = () => {
    if (barcodeDetectorRef.current) return barcodeDetectorRef.current;

    if (!('BarcodeDetector' in window)) {
      throw new Error('Browser tidak mendukung BarcodeDetector');
    }

    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    barcodeDetectorRef.current = detector;
    return detector;
  };

  const getReadableCameraError = (error) => {
    if (!error) return 'Unknown camera error';
    if (error?.name === 'NotAllowedError') return 'Izin kamera ditolak. Aktifkan izin kamera pada browser.';
    if (error?.name === 'NotFoundError') return 'Kamera tidak ditemukan. Pastikan kamera tersambung.';
    if (error?.name === 'NotReadableError') return 'Kamera sedang dipakai aplikasi lain (Zoom/Meet/kamera app).';
    if (error?.name === 'OverconstrainedError') return 'Konfigurasi kamera terlalu ketat. Coba kamera lain.';
    if (error?.name === 'AbortError') return 'Gagal memulai kamera. Coba ulangi beberapa detik lagi.';
    return error?.message || String(error);
  };

  const startHtml5ScannerWithFallbacks = async (scanner, activeCameraId, onDecode) => {
    const attempts = [
      () => scanner.start(activeCameraId, CAMERA_SCAN_CONFIG, onDecode),
      () => scanner.start({ facingMode: 'environment' }, CAMERA_SCAN_CONFIG, onDecode),
      () => scanner.start({ facingMode: 'user' }, CAMERA_SCAN_CONFIG, onDecode),
    ];

    let lastError = null;
    for (const attempt of attempts) {
      try {
        await attempt();
        return;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Tidak dapat memulai scanner html5-qrcode');
  };

  const getNativeStreamWithFallbacks = async (activeCameraId) => {
    const attempts = [
      {
        audio: false,
        video: {
          deviceId: { exact: activeCameraId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        audio: false,
        video: {
          deviceId: { ideal: activeCameraId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
    ];

    let lastError = null;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Tidak dapat membuka stream kamera');
  };

  const stopCamera = async () => {
    try {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      if (html5ScannerRef.current) {
        const state = html5ScannerRef.current.getState?.();
        if (state === 2) {
          await html5ScannerRef.current.stop();
        }
        await html5ScannerRef.current.clear();
        html5ScannerRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    } catch {
      // ignore cleanup failures
    }

    setScanMode('idle');
    setScannerEngine('native');
  };

  const findOrder = (qrValue) => {
    const q = String(qrValue || '').trim().toLowerCase();
    const found = orders.find((o) =>
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

  const startDetectLoop = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    scanIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const detector = ensureBarcodeDetector();
        const results = await detector.detect(video);
        if (Array.isArray(results) && results.length > 0) {
          const rawValue = results[0]?.rawValue;
          if (rawValue) {
            findOrder(rawValue);
          }
        }
      } catch {
        // ignore frame-by-frame errors
      }
    }, 220);
  };

  const startCamera = async () => {
    setCameraError('');
    setScanMode('camera');

    window.setTimeout(async () => {
      try {
        await stopCamera();
        setScanMode('camera');

        if (!('BarcodeDetector' in window)) {
          setScannerEngine('html5');

          let cameras = availableCameras;
          if (cameras.length === 0) {
            cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              setAvailableCameras(cameras);
            }
          }

          const activeCameraId = selectedCameraId || pickPreferredCamera(cameras)?.id || '';
          if (!activeCameraId) {
            throw new Error('Tidak ada kamera yang dipilih');
          }

          const scanner = new Html5Qrcode('qr-camera-fallback');
          html5ScannerRef.current = scanner;

          await startHtml5ScannerWithFallbacks(
            scanner,
            activeCameraId,
            (decodedText) => {
              if (decodedText) {
                findOrder(decodedText);
              }
            }
          );

          return;
        }

        setScannerEngine('native');

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Browser tidak mendukung getUserMedia');
        }

        let cameras = availableCameras;
        if (cameras.length === 0) {
          cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
          }
        }

        const activeCameraId = selectedCameraId || pickPreferredCamera(cameras)?.id || '';
        if (!activeCameraId) {
          throw new Error('Tidak ada kamera yang dipilih');
        }

        const stream = await getNativeStreamWithFallbacks(activeCameraId);

        const video = videoRef.current;
        if (!video) {
          throw new Error('Elemen video scanner tidak tersedia');
        }

        mediaStreamRef.current = stream;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        await video.play();

        const track = stream.getVideoTracks()?.[0];
        if (track?.applyConstraints) {
          try {
            await track.applyConstraints({
              advanced: [
                { focusMode: 'continuous' },
                { sharpness: 1 },
              ],
            });
          } catch {
            // ignore unsupported camera constraints
          }
        }

        startDetectLoop();
      } catch (err) {
        console.error('[QRScanner] Error starting camera:', err);
        setCameraError(getReadableCameraError(err));
        setScanMode('idle');
      }
    }, 100);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError('');
    setScanMode('file');

    try {
      const scanner = new Html5Qrcode('qr-file-region');
      const result = await scanner.scanFile(file, true);
      findOrder(result);
    } catch {
      setCameraError('QR code tidak terbaca dari file. Coba gambar yang lebih jelas.');
    } finally {
      setScanMode('idle');
      e.target.value = '';
    }
  };

  const handleSearch = () => {
    const q = searchQuery.toLowerCase();
    const found = orders.find((o) =>
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

  useEffect(() => {
    getAvailableCameras();
    return () => {
      stopCamera();
    };
  }, []);

  const qrOrders = orders.filter((o) =>
    !searchQuery ||
    o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-dialog" onClick={(e) => e.stopPropagation()}>

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
                  <div className="qr-viewfinder">
                    <div className="qr-viewfinder-corner tl" />
                    <div className="qr-viewfinder-corner tr" />
                    <div className="qr-viewfinder-corner bl" />
                    <div className="qr-viewfinder-corner br" />

                    {scanMode === 'camera' ? (
                      <div className={`qr-camera-region ${scannerEngine === 'native' ? 'native-engine' : 'html5-engine'}`}>
                        <video
                          ref={videoRef}
                          className={`qr-camera-video ${scannerEngine === 'native' ? '' : 'hidden'}`}
                          autoPlay
                          muted
                          playsInline
                        />
                        <div
                          id="qr-camera-fallback"
                          className={`qr-camera-fallback ${scannerEngine === 'html5' ? '' : 'hidden'}`}
                        />
                      </div>
                    ) : (
                      <div className="qr-viewfinder-inner">
                        <QrCode size={40} className="qr-viewfinder-icon" />
                        <p className="qr-viewfinder-text">
                          {scanMode === 'file' ? 'Membaca QR dari file...' : 'Pilih metode scan di bawah'}
                        </p>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="qr-error">
                      <X size={14} /> {cameraError}
                    </div>
                  )}

                  {availableCameras.length >= 1 && scanMode === 'idle' && (
                    <div className="qr-camera-selector">
                      <label>
                        {availableCameras.length > 1 ? 'Pilih Kamera:' : 'Kamera yang Digunakan:'}
                      </label>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="qr-camera-select"
                        disabled={availableCameras.length === 1}
                      >
                        {availableCameras.map((camera, index) => (
                          <option key={camera.id} value={camera.id}>
                            {camera.label || `Kamera ${index + 1}`} ({camera.id.slice(0, 10)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="qr-file-hidden"
                    onChange={handleFileUpload}
                  />
                  <div id="qr-file-region" style={{ display: 'none' }} />

                  <div className="qr-divider">atau cari manual</div>

                  <div className="qr-search-wrap">
                    <input
                      className="qr-search-input"
                      placeholder="No. order atau nama customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="qr-search-btn" onClick={handleSearch}>
                      <Search size={16} />
                    </button>
                  </div>
                </>
              )}

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
                          onChange={(e) => setNewStatus(e.target.value)}
                        >
                          {STATUS_OPTIONS.map((o) => {
                            const currentStatusIdx = STATUS_FLOW.indexOf(foundOrder.status);
                            const optionIdx = STATUS_FLOW.indexOf(o.value);
                            const isDisabled = optionIdx <= currentStatusIdx;
                            return (
                              <option 
                                key={o.value} 
                                value={o.value}
                                disabled={isDisabled}
                              >
                                {o.label}
                              </option>
                            );
                          })}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="qr-list-search-icon" />
              </div>

              <div className="qr-order-list">
                {qrOrders.map((o) => (
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
