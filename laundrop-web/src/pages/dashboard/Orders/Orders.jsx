import { useState, useMemo, useEffect } from 'react';
import { Plus, List, Map as MapIcon, QrCode, Search, X } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { MOCK_ORDERS, MOCK_EMPLOYEES } from '../../../data/mockData';
import { STATUS_CONFIG } from '../../../data/statusConfig';
import OrderListView from '../../../components/Dashboard/Orders/OrderListView';
import PickupMap from '../../../components/Dashboard/Orders/PickupMap';
import OrderFormDialog from '../../../components/Dashboard/Orders/OrderFormDialog';
import OrderDetailModal from '../../../components/Dashboard/Orders/OrderDetailModal';
import QRScannerModal from '../../../components/Dashboard/Orders/QRScannerModal';
import InvoiceModal from '../../../components/Dashboard/Orders/InvoiceModal';
import ThermalPrinterModal from '../../../components/Dashboard/Orders/ThermalPrinterModal';
import Pagination from '../../../components/shared/Pagination';
import Toast from '../../../components/shared/Toast';
import api from '../../../services/api';
import './Orders.css';

const STATUS_FILTERS = ['all', 'waiting_confirmation', 'pickup', 'picked_up', 'waiting_payment', 'washing', 'washing_finished', 'delivery', 'completed', 'cancelled'];
const ITEMS_PER_PAGE = 10;

// Backend error() always puts message in .errors, not .message
const getApiError = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data?.errors === 'string') return data.errors;
  if (typeof data?.message === 'string' && data.message !== 'Terjadi kesalahan') return data.message;
  return fallback;
};

const getFilterLabel = (key) => {
  if (key === 'all') return 'Semua';
  return STATUS_CONFIG[key]?.label ?? key;
};

export default function Orders() {
  const { role } = useRole();

  const [orders, setOrders]             = useState([]);
  const [view, setView]                 = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [editOrder, setEditOrder]       = useState(null);
  const [detailOrder, setDetailOrder]   = useState(null);
  const [deleteOrder, setDeleteOrder]   = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null); // ✅
  const [thermalPrinterOrder, setThermalPrinterOrder] = useState(null); // ✅ Thermal printer
  const [toast, setToast]               = useState(null);
  const [showQR, setShowQR]             = useState(false);
  const [billingOrder, setBillingOrder] = useState(null);
  const [billingWeight, setBillingWeight] = useState('');
  const [billingPhoto, setBillingPhoto] = useState(null);
  const [billingNotes, setBillingNotes] = useState('');
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [cashPaymentOrder, setCashPaymentOrder] = useState(null);
  const [cashPaymentPhoto, setCashPaymentPhoto] = useState(null);
  const [cashPaymentNotes, setCashPaymentNotes] = useState('');
  const [cashPaymentSubmitting, setCashPaymentSubmitting] = useState(false);
  const [pickupPhotoOrder, setPickupPhotoOrder] = useState(null);
  const [pickupPhoto, setPickupPhoto] = useState(null);
  const [pickupPhotoNotes, setPickupPhotoNotes] = useState('');
  const [pickupPhotoSubmitting, setPickupPhotoSubmitting] = useState(false);

  const canManage = role === 'owner' || role === 'employee';

  const getStatusBlockReason = (order, newStatus) => {
    if (!order || !newStatus) return '';

    const paymentMethod = String(order.payment_method || order?.raw?.payment_method || '').toLowerCase();
    const paymentStatus = String(order.payment_status || 'unpaid').toLowerCase();
    const isNonCash = paymentMethod !== '' && paymentMethod !== 'cash';

    if (newStatus === 'delivery' && isNonCash && paymentStatus !== 'paid') {
      return 'Order non-cash hanya bisa ke delivery setelah pembayaran lunas.';
    }

    if (newStatus === 'completed' && paymentStatus !== 'paid') {
      if (paymentMethod === 'cash') {
        return 'Order cash hanya bisa selesai setelah pembayaran dikonfirmasi saat pengantaran.';
      }
      return 'Order hanya bisa selesai setelah pembayaran lunas.';
    }

    return '';
  };

  const mapApiOrderToUi = (row) => {
    const estimatedWeight = Number(row?.estimated_weight ?? 0);
    const actualWeight = Number(row?.actual_weight ?? 0);
    const effectiveWeight = actualWeight > 0 ? actualWeight : estimatedWeight;
    const unitPrice = Number(row?.service?.price_per_kg ?? 0);
    const backendTotal = Number(row?.transaction?.total_amount ?? 0);

    return {
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      payment_method: row?.payment_method || 'cash',
      payment_status: row?.transaction?.payment?.status === 'success' || row.status === 'completed' ? 'paid' : 'unpaid',
      customer_name: row?.customer?.name || '-',
      customer_phone: row?.customer?.phone || '-',
      address: row?.pickup_address || '-',
      customer_address: row?.pickup_address || '-',
      latitude: row?.pickup_lat != null ? Number(row.pickup_lat) : null,
      longitude: row?.pickup_lng != null ? Number(row.pickup_lng) : null,
      assigned_employee: row?.employee?.name || '-',
      service_name: row?.service?.name || '-',
      weight: effectiveWeight,
      quantity: effectiveWeight,
      unit: 'kg',
      total_amount: backendTotal > 0 ? backendTotal : (effectiveWeight * unitPrice),
      notes: row?.notes || '',
      pickup_date: row?.pickup_date || null,
      pickup_time: row?.pickup_time || null,
      created_at: row?.created_at || null,
      raw: row,
    };
  };

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/orders', { params: { per_page: 100 } });
        const rows = response?.data?.data ?? [];
        if (!mounted) return;
        setOrders(rows.map(mapApiOrderToUi));
      } catch (err) {
        if (!mounted) return;
        setOrders([]);
        setError(err?.response?.data?.message || 'Gagal memuat order dari server');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    setPage(1);
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchSearch = !search ||
        [o.order_number, o.customer_name, o.customer_phone]
          .some(v => (v || '').toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSave = (data) => {
    if (editOrder) {
      const updated = { ...editOrder, ...data };
      setOrders(prev => prev.map(o => o.id === editOrder.id ? updated : o));
      showToast('Pesanan berhasil diupdate!');
      setInvoiceOrder(updated); // ✅ tampilkan invoice setelah edit
    } else {
      const newOrder = {
        ...data,
        id: Date.now(),
        order_number: `LD-${Date.now().toString().slice(-8)}`,
        pickup_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      setOrders(prev => [newOrder, ...prev]);
      showToast('Pesanan baru berhasil ditambahkan!');
      setInvoiceOrder(newOrder); // ✅ tampilkan invoice setelah buat baru
    }
    setShowForm(false);
    setEditOrder(null);
  };

  const handleDelete = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeleteOrder(null);
    showToast('Pesanan berhasil dihapus!', 'danger');
  };

  const handleStatusChange = (id, newStatus) => {
    const currentOrder = orders.find((o) => o.id === id);
    const blockReason = getStatusBlockReason(currentOrder, newStatus);
    if (blockReason) {
      showToast(blockReason, 'danger');
      return;
    }

    // Intercept pickup -> picked_up to show photo upload modal
    if (newStatus === 'picked_up' && currentOrder?.status === 'pickup') {
      setPickupPhotoOrder(currentOrder);
      setPickupPhoto(null);
      setPickupPhotoNotes('');
      return;
    }

    const updateStatus = async () => {
      try {
        await api.patch(`/orders/${id}/status`, { status: newStatus });
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        showToast('Status pesanan berhasil diupdate!');
      } catch (err) {
        showToast(getApiError(err, 'Gagal update status'), 'danger');
      }
    };

    updateStatus();
  };

  const closePickupPhotoModal = () => {
    setPickupPhotoOrder(null);
    setPickupPhoto(null);
    setPickupPhotoNotes('');
  };

  const handleSubmitPickupPhoto = async (e) => {
    e.preventDefault();
    if (!pickupPhotoOrder?.id) return;

    try {
      setPickupPhotoSubmitting(true);

      // Upload photo if provided
      if (pickupPhoto) {
        const formData = new FormData();
        formData.append('type', 'pickup');
        formData.append('photo', pickupPhoto);
        await api.post(`/orders/${pickupPhotoOrder.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Update status to picked_up
      await api.patch(`/orders/${pickupPhotoOrder.id}/status`, { status: 'picked_up' });
      setOrders((prev) => prev.map((o) =>
        o.id === pickupPhotoOrder.id ? { ...o, status: 'picked_up' } : o
      ));

      showToast('Pakaian berhasil dijemput!');
      closePickupPhotoModal();
    } catch (err) {
      showToast(getApiError(err, 'Gagal konfirmasi pickup'), 'danger');
    } finally {
      setPickupPhotoSubmitting(false);
    }
  };

  const openBillModal = (order) => {
    setBillingOrder(order);
    setBillingWeight(order?.weight ? String(order.weight) : '');
    setBillingPhoto(null);
    setBillingNotes('');
  };

  const closeBillModal = () => {
    setBillingOrder(null);
    setBillingWeight('');
    setBillingPhoto(null);
    setBillingNotes('');
  };

  const openCashPaymentModal = (order) => {
    setCashPaymentOrder(order);
    setCashPaymentPhoto(null);
    setCashPaymentNotes('');
  };

  const closeCashPaymentModal = () => {
    setCashPaymentOrder(null);
    setCashPaymentPhoto(null);
    setCashPaymentNotes('');
  };

  const handleSubmitBill = async (e) => {
    e.preventDefault();
    if (!billingOrder?.id) return;

    const actualWeight = Number(billingWeight);
    if (Number.isNaN(actualWeight) || actualWeight <= 0) {
      showToast('Berat real tidak valid', 'danger');
      return;
    }

    if (!billingPhoto) {
      showToast('Foto timbangan wajib diisi', 'danger');
      return;
    }

    try {
      setBillingSubmitting(true);
      const formData = new FormData();
      formData.append('actual_weight', String(actualWeight));
      if (billingNotes.trim()) {
        formData.append('notes', billingNotes.trim());
      }
      if (billingPhoto) {
        formData.append('photo_scale', billingPhoto);
      }

      const response = await api.post(`/orders/${billingOrder.id}/bill`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transaction = response?.data?.data;
      setOrders((prev) => prev.map((item) => {
        if (item.id !== billingOrder.id) return item;
        return {
          ...item,
          status: 'waiting_payment',
          weight: Number(transaction?.actual_weight || actualWeight),
          quantity: Number(transaction?.actual_weight || actualWeight),
          total_amount: Number(transaction?.total_amount || item.total_amount),
        };
      }));

      showToast('Tagihan berhasil dibuat dan status jadi waiting_payment');
      closeBillModal();
    } catch (err) {
      showToast(getApiError(err, 'Gagal membuat tagihan'), 'danger');
    } finally {
      setBillingSubmitting(false);
    }
  };

  const handleConfirmCashPayment = async (e) => {
    e.preventDefault();
    if (!cashPaymentOrder?.id) return;

    if (!cashPaymentPhoto) {
      showToast('Foto bukti serah terima wajib diisi', 'danger');
      return;
    }

    try {
      setCashPaymentSubmitting(true);

      const formData = new FormData();
      if (cashPaymentNotes.trim()) {
        formData.append('notes', cashPaymentNotes.trim());
      }
      if (cashPaymentPhoto) {
        formData.append('photo_delivery', cashPaymentPhoto);
      }

      await api.post(`/orders/${cashPaymentOrder.id}/confirm-cash-payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOrders((prev) => prev.map((item) => {
        if (item.id !== cashPaymentOrder.id) return item;
        return {
          ...item,
          status: 'completed',
          payment_status: 'paid',
        };
      }));

      showToast('Pembayaran cash diterima, status pesanan selesai');
      closeCashPaymentModal();
    } catch (err) {
      showToast(getApiError(err, 'Gagal konfirmasi pembayaran cash'), 'danger');
    } finally {
      setCashPaymentSubmitting(false);
    }
  };

  const openNewForm  = () => { setEditOrder(null); setShowForm(true); };
  const openEditForm = (order) => { setEditOrder(order); setShowForm(true); };
  const closeForm    = () => { setShowForm(false); setEditOrder(null); };

  return (
    <div className="ow-orders-page">

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Topbar */}
      <div className="ow-orders-topbar">
        <div className="ow-orders-topbar-left">
          <h1 className="ow-orders-title">Order</h1>
          <p className="ow-orders-subtitle">{filtered.length} dari {orders.length} pesanan</p>
        </div>
        <div className="ow-orders-topbar-right">
          <div className="ow-view-toggle">
            <button
              className={`ow-view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <List size={15} /> List
            </button>
            <button
              className={`ow-view-btn ${view === 'map' ? 'active' : ''}`}
              onClick={() => setView('map')}
            >
              <MapIcon size={15} /> Map View
            </button>
          </div>

          {canManage && (
            <button className="ow-btn-qr" onClick={() => setShowQR(true)}>
              <QrCode size={15} /> Scan QR
            </button>
          )}

          {canManage && (
            <button className="ow-btn-new" onClick={openNewForm}>
              <Plus size={16} /> New Order
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="ow-status-filters">
        {STATUS_FILTERS.map(s => {
          const count = s !== 'all' ? orders.filter(o => o.status === s).length : null;
          return (
            <button
              key={s}
              className={`ow-filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {getFilterLabel(s)}
              {count !== null && (
                <span className={`ow-filter-count ${statusFilter === s ? 'active' : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="ow-search-wrap">
        <Search size={15} className="ow-search-icon" />
        <input
          className="ow-search-input"
          placeholder="Cari no. order, nama customer, atau no. HP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="ow-search-clear" onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      {error && <div className="ow-orders-error">{error}</div>}

      {loading ? (
        <div className="ow-orders-loading">Memuat data order...</div>
      ) : view === 'map' ? (
        <div className="ow-map-wrapper">
          <PickupMap orders={filtered} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ow-orders-empty">
          <p className="ow-orders-empty-title">Tidak ada pesanan ditemukan</p>
          <p className="ow-orders-empty-sub">Coba ubah filter atau buat pesanan baru</p>
          {canManage && (
            <button className="ow-btn-new" style={{ marginTop: 16 }} onClick={openNewForm}>
              <Plus size={16} /> Buat Pesanan Pertama
            </button>
          )}
        </div>
      ) : (
        <>
          <OrderListView
            orders={paginated}
            employees={MOCK_EMPLOYEES}
            canManage={canManage}
            onEdit={openEditForm}
            onDelete={(id) => setDeleteOrder(orders.find(o => o.id === id))}
            onViewDetail={setDetailOrder}
            onStatusChange={handleStatusChange}
            getStatusBlockReason={getStatusBlockReason}
            onBill={openBillModal}
            onConfirmCashPayment={openCashPaymentModal}
          />
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onPrint={(order) => setThermalPrinterOrder(order)}
        />
      )}

      {/* Delete Modal */}
      {deleteOrder && (
        <div className="ow-modal-overlay" onClick={() => setDeleteOrder(null)}>
          <div className="ow-modal-box small" onClick={e => e.stopPropagation()}>
            <div className="ow-modal-header">
              <h3>Hapus Pesanan?</h3>
              <button className="ow-modal-close" onClick={() => setDeleteOrder(null)}>✕</button>
            </div>
            <div className="ow-modal-body">
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Pesanan <strong>{deleteOrder.order_number}</strong> akan dihapus permanen.
              </p>
            </div>
            <div className="ow-modal-footer">
              <button className="ow-btn-cancel" onClick={() => setDeleteOrder(null)}>Batal</button>
              <button className="ow-btn-delete" onClick={() => handleDelete(deleteOrder.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <OrderFormDialog
          order={editOrder}
          employees={MOCK_EMPLOYEES}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {/* QR Scanner Modal */}
      {showQR && (
        <QRScannerModal
          orders={orders}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            showToast('Status pesanan berhasil diupdate via QR!');
          }}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* ✅ Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* ✅ Thermal Printer Modal */}
      {thermalPrinterOrder && (
        <ThermalPrinterModal
          order={thermalPrinterOrder}
          onClose={() => setThermalPrinterOrder(null)}
        />
      )}

      {billingOrder && (
        <div className="ow-modal-overlay" onClick={closeBillModal}>
          <div className="ow-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-header">
              <h3>Input Berat Real & Buat Tagihan</h3>
              <button className="ow-modal-close" onClick={closeBillModal}>✕</button>
            </div>
            <form className="ow-modal-body ow-bill-form" onSubmit={handleSubmitBill}>
              <label className="ow-bill-label">
                Berat Real (kg)
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={billingWeight}
                  onChange={(e) => setBillingWeight(e.target.value)}
                  required
                  className="ow-bill-input"
                />
              </label>

              <label className="ow-bill-label">
                <span>Foto Timbangan <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBillingPhoto(e.target.files?.[0] || null)}
                  className="ow-bill-file"
                  required
                />
              </label>

              <label className="ow-bill-label">
                Catatan (opsional)
                <textarea
                  rows={2}
                  value={billingNotes}
                  onChange={(e) => setBillingNotes(e.target.value)}
                  className="ow-bill-textarea"
                  placeholder="Contoh: ditimbang ulang oleh admin"
                />
              </label>

              <div className="ow-modal-footer" style={{ padding: '16px 0 0' }}>
                <button type="button" className="ow-btn-cancel" onClick={closeBillModal} disabled={billingSubmitting}>
                  Batal
                </button>
                <button type="submit" className="ow-btn-new" disabled={billingSubmitting}>
                  {billingSubmitting ? 'Menyimpan...' : 'Buat Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pickupPhotoOrder && (
        <div className="ow-modal-overlay" onClick={closePickupPhotoModal}>
          <div className="ow-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-header">
              <h3>Konfirmasi Pakaian Dijemput</h3>
              <button className="ow-modal-close" onClick={closePickupPhotoModal}>✕</button>
            </div>
            <form className="ow-modal-body ow-bill-form" onSubmit={handleSubmitPickupPhoto}>
              <p className="ow-cash-helper">
                Order <strong>{pickupPhotoOrder.order_number}</strong> — {pickupPhotoOrder.customer_name}
              </p>

              <label className="ow-bill-label">
                <span>Foto Bukti Pengambilan Pakaian <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPickupPhoto(e.target.files?.[0] || null)}
                  className="ow-bill-file"
                  required
                />
              </label>
              {pickupPhoto && (
                <p style={{ fontSize: 12, color: '#16a34a', marginTop: -8 }}>
                  ✓ {pickupPhoto.name}
                </p>
              )}

              <div className="ow-modal-footer" style={{ padding: '16px 0 0' }}>
                <button type="button" className="ow-btn-cancel" onClick={closePickupPhotoModal} disabled={pickupPhotoSubmitting}>
                  Batal
                </button>
                <button type="submit" className="ow-btn-new" disabled={pickupPhotoSubmitting}>
                  {pickupPhotoSubmitting ? 'Menyimpan...' : 'Konfirmasi Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cashPaymentOrder && (
        <div className="ow-modal-overlay" onClick={closeCashPaymentModal}>
          <div className="ow-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-header">
              <h3>Konfirmasi Pembayaran Cash</h3>
              <button className="ow-modal-close" onClick={closeCashPaymentModal}>✕</button>
            </div>
            <form className="ow-modal-body ow-bill-form" onSubmit={handleConfirmCashPayment}>
              <p className="ow-cash-helper">
                Pastikan pembayaran cash sudah diterima kurir di lokasi sebelum konfirmasi.
              </p>

              <label className="ow-bill-label">
                <span>Foto Bukti Serah Terima <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCashPaymentPhoto(e.target.files?.[0] || null)}
                  className="ow-bill-file"
                  required
                />
              </label>

              <label className="ow-bill-label">
                Catatan (opsional)
                <textarea
                  rows={2}
                  value={cashPaymentNotes}
                  onChange={(e) => setCashPaymentNotes(e.target.value)}
                  className="ow-bill-textarea"
                  placeholder="Contoh: pembayaran diterima oleh kurir di lokasi"
                />
              </label>

              <div className="ow-modal-footer" style={{ padding: '16px 0 0' }}>
                <button type="button" className="ow-btn-cancel" onClick={closeCashPaymentModal} disabled={cashPaymentSubmitting}>
                  Batal
                </button>
                <button type="submit" className="ow-btn-new" disabled={cashPaymentSubmitting}>
                  {cashPaymentSubmitting ? 'Menyimpan...' : 'Pembayaran Diterima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}