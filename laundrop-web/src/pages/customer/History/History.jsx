import { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronRight, Truck } from 'lucide-react';
import Layout from '../../../components/Customer/Layout';
import PageTitle from '../../../components/ui/PageTitle';
import StatusBadge from '../../../components/ui/StatusBadge';
import OrderDetailModal from '../../../components/Customer/Orders/OrderDetailModal';
import TrackOrderModal from '../../../components/Customer/Orders/TrackOrderModal';
import PaymentQrisModal from '../../../components/Customer/Orders/PaymentQrisModal';
import api from '../../../services/api';
import { formatRp } from '../../../context/AppContext';
import './History.css';

const FILTERS = ['All', 'Pending', 'On Progress', 'Completed', 'Cancelled'];

const STATUS_LABEL_MAP = {
  waiting_confirmation: 'Pending',
  pickup: 'On Progress',
  picked_up: 'On Progress',
  waiting_payment: 'On Progress',
  washing: 'On Progress',
  washing_finished: 'On Progress',
  delivery: 'On Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TRACKABLE_BACKEND_STATUS = new Set([
  'waiting_confirmation',
  'pickup',
  'picked_up',
  'waiting_payment',
  'washing',
  'washing_finished',
  'delivery',
  'completed',
]);

const getApiOrigin = () => {
  const baseUrl = String(api.defaults.baseURL || '').trim();
  if (!baseUrl) return '';

  try {
    const parsed = new URL(baseUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
};

const API_ORIGIN = getApiOrigin();

const toStorageUrl = (path) => {
  if (!path) return null;
  if (String(path).startsWith('http')) return path;
  if (!API_ORIGIN) return null;
  return `${API_ORIGIN}/storage/${String(path).replace(/^\/+/, '')}`;
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '-';
  if (typeof value === 'string' && value.length >= 5) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatTimelineDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildTimeline(status, orderType = 'pickup', statusLogs = [], createdAt = null) {
  const key = String(status || '').toLowerCase();
  const typeKey = String(orderType || 'pickup').toLowerCase();
  const isCancelled = key === 'cancelled';
  const statusTimeMap = (Array.isArray(statusLogs) ? statusLogs : []).reduce((acc, log) => {
    const after = String(log?.status_after || '').toLowerCase();
    if (!after) return acc;
    if (!acc[after]) acc[after] = formatTimelineDateTime(log?.created_at);
    return acc;
  }, {});

  if (!statusTimeMap.waiting_confirmation) {
    statusTimeMap.waiting_confirmation = formatTimelineDateTime(createdAt);
  }

  const pickupSteps = [
    { key: 'waiting_confirmation', label: 'Menunggu konfirmasi' },
    { key: 'pickup', label: 'Dalam penjemputan' },
    { key: 'picked_up', label: 'Pakaian dijemput' },
    { key: 'waiting_payment', label: 'Menunggu pembayaran' },
    { key: 'washing', label: 'Proses pencucian' },
    { key: 'washing_finished', label: 'Pencucian selesai' },
    { key: 'delivery', label: 'Dalam pengantaran' },
    { key: 'completed', label: 'Selesai' },
  ];

  const dropOffSteps = [
    { key: 'waiting_confirmation', label: 'Menunggu konfirmasi' },
    { key: 'pickup', label: 'Menunggu pakaian di drop off' },
    { key: 'picked_up', label: 'Pakaian di drop off' },
    { key: 'waiting_payment', label: 'Menunggu pembayaran' },
    { key: 'washing', label: 'Proses pencucian' },
    { key: 'washing_finished', label: 'Pencucian selesai' },
    { key: 'delivery', label: 'Dalam pengantaran' },
    { key: 'completed', label: 'Selesai' },
  ];

  const steps = typeKey === 'drop_off' ? dropOffSteps : pickupSteps;

  const progressRank = {
    waiting_confirmation: 1,
    pickup: 2,
    picked_up: 3,
    waiting_payment: 4,
    washing: 5,
    washing_finished: 6,
    delivery: 7,
    completed: 8,
    cancelled: 0,
  };

  const rank = progressRank[key] ?? 1;

  if (isCancelled) {
    return [
      { label: 'Menunggu konfirmasi', done: true, time: statusTimeMap.waiting_confirmation || '' },
      { label: 'Dibatalkan', done: true, time: statusTimeMap.cancelled || '' },
    ];
  }

  return steps.map((step, index) => ({
    label: step.label,
    done: index + 1 <= rank,
    time: index + 1 <= rank ? (statusTimeMap[step.key] || '') : '',
  }));
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelCandidate, setCancelCandidate] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingLoadingId, setTrackingLoadingId] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);

  const isPendingOrder = (order) => String(order?.backend_status || '').toLowerCase() === 'waiting_confirmation';

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/orders', { params: { per_page: 100 } });
        const rows = response?.data?.data ?? [];  // API returns { data: { data: [...], links, meta } }

        const mapRowToOrder = (row) => {
          const unitPrice = Number(row?.service?.price_per_kg ?? 0);
          const estimatedWeight = Number(row?.estimated_weight ?? 0);
          const actualWeight = Number(row?.actual_weight ?? 0);
          const effectiveWeight = actualWeight > 0 ? actualWeight : estimatedWeight;
          const total = Number(row?.transaction?.total_amount ?? (unitPrice * effectiveWeight));
          const statusLogs = Array.isArray(row?.status_logs) ? row.status_logs : [];

          return {
            id: row.order_number || `ORD-${row.id}`,
            rawId: row.id,
            order_number: row.order_number || `ORD-${row.id}`,
            status: STATUS_LABEL_MAP[row?.status] ?? 'Pending',
            backend_status: row?.status,
            date: formatDate(row?.created_at),
            service: row?.service?.name ?? 'Layanan Laundry',
            weight: estimatedWeight,
            actual_weight: actualWeight,
            price: total,
            pickupAddress: row?.pickup_address ?? '-',
            pickupDate: formatDate(row?.pickup_date),
            pickupTime: formatTime(row?.pickup_time),
            paymentMethod: (row?.payment_method || '').toUpperCase(),
            payment_status: row?.transaction?.payment?.status === 'success' || row?.status === 'completed' ? 'paid' : 'unpaid',
            verified: actualWeight > 0,
            estimated_price: unitPrice * estimatedWeight,
            deliveryAddress: row?.delivery_address ?? row?.pickup_address ?? '-',
            notes: row?.notes || '',
            orderType: row?.order_type ?? 'pickup',
            photo_pickup_url: toStorageUrl(row?.photo_pickup),
            photo_delivery_url: toStorageUrl(row?.photo_delivery),
            photos: {
              pickup: toStorageUrl(row?.photos?.pickup ?? row?.photo_pickup),
              scale: toStorageUrl(row?.photos?.scale ?? row?.photo_scale),
              delivery: toStorageUrl(row?.photos?.delivery ?? row?.photo_delivery),
            },
            status_logs: statusLogs,
            created_at: row?.created_at || null,
            timeline: buildTimeline(row?.status, row?.order_type, statusLogs, row?.created_at),
          };
        };

        const mapped = rows.map(mapRowToOrder);

        if (mounted) setOrders(mapped);
      } catch (err) {
        if (!mounted) return;
        setOrders([]);
        setError(err?.response?.data?.message || 'Gagal memuat riwayat pesanan');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();

    // Refetch when tab regains focus (e.g. employee changed status in another tab)
    const handleFocus = () => { if (mounted) fetchOrders(); };
    window.addEventListener('focus', handleFocus);

    // Refetch every 30 seconds for active orders
    const interval = setInterval(() => { if (mounted) fetchOrders(); }, 30000);

    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleCancelOrder = (order) => {
    if (!order || !isPendingOrder(order) || !order.rawId) return;

    setCancelCandidate(order);
  };

  const confirmCancelOrder = async () => {
    if (!cancelCandidate?.rawId || !isPendingOrder(cancelCandidate)) {
      setCancelCandidate(null);
      return;
    }

    const order = cancelCandidate;

    try {
      setActionError('');
      setCancellingId(order.rawId);
      await api.patch(`/orders/${order.rawId}/cancel`);

      setOrders((prev) => prev.map((item) => {
        if (item.rawId !== order.rawId) return item;
        return {
          ...item,
          status: 'Cancelled',
          backend_status: 'cancelled',
          timeline: buildTimeline('cancelled'),
        };
      }));

      if (selectedOrder?.rawId === order.rawId) {
        setSelectedOrder(null);
      }
      if (trackingOrder?.rawId === order.rawId) {
        setTrackingOrder(null);
      }
      setCancelCandidate(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'All') return orders;
    return orders.filter((o) => o.status === filter);
  }, [filter, orders]);

  const openTrackingOrder = async (order) => {
    if (!order?.rawId) {
      setTrackingOrder(order);
      return;
    }

    setTrackingOrder(order);
    setTrackingLoadingId(order.rawId);

    try {
      const response = await api.get(`/orders/${order.rawId}`);
      const row = response?.data?.data;
      if (!row) return;

      const unitPrice = Number(row?.service?.price_per_kg ?? 0);
      const estimatedWeight = Number(row?.estimated_weight ?? 0);
      const actualWeight = Number(row?.actual_weight ?? 0);
      const effectiveWeight = actualWeight > 0 ? actualWeight : estimatedWeight;
      const total = Number(row?.transaction?.total_amount ?? (unitPrice * effectiveWeight));
      const statusLogs = Array.isArray(row?.status_logs) ? row.status_logs : [];

      setTrackingOrder((prev) => {
        if (!prev || prev.rawId !== order.rawId) return prev;

        return {
          ...prev,
          service: row?.service?.name ?? prev.service,
          backend_status: row?.status ?? prev.backend_status,
          status: STATUS_LABEL_MAP[row?.status] ?? prev.status,
          weight: estimatedWeight || prev.weight,
          actual_weight: actualWeight || prev.actual_weight,
          price: total,
          estimated_price: unitPrice * estimatedWeight,
          paymentMethod: (row?.payment_method || prev.paymentMethod || '').toUpperCase(),
          payment_status: row?.transaction?.payment?.status === 'success' || row?.status === 'completed' ? 'paid' : 'unpaid',
          pickupAddress: row?.pickup_address ?? prev.pickupAddress,
          deliveryAddress: row?.delivery_address ?? row?.pickup_address ?? prev.deliveryAddress,
          pickupDate: formatDate(row?.pickup_date),
          pickupTime: formatTime(row?.pickup_time),
          notes: row?.notes || prev.notes,
          orderType: row?.order_type ?? prev.orderType,
          photo_pickup_url: toStorageUrl(row?.photo_pickup),
          photo_delivery_url: toStorageUrl(row?.photo_delivery),
          photos: {
            pickup: toStorageUrl(row?.photos?.pickup ?? row?.photo_pickup),
            scale: toStorageUrl(row?.photos?.scale ?? row?.photo_scale),
            delivery: toStorageUrl(row?.photos?.delivery ?? row?.photo_delivery),
          },
          status_logs: statusLogs,
          created_at: row?.created_at || prev.created_at,
          timeline: buildTimeline(row?.status, row?.order_type, statusLogs, row?.created_at),
        };
      });
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Gagal memuat detail tracking order');
    } finally {
      setTrackingLoadingId(null);
    }
  };

  const openOrderDetail = async (order) => {
    if (!order?.rawId) {
      setSelectedOrder(order);
      return;
    }

    setSelectedOrder(order);
    setDetailLoadingId(order.rawId);

    try {
      const response = await api.get(`/orders/${order.rawId}`);
      const row = response?.data?.data;
      if (!row) return;

      const unitPrice = Number(row?.service?.price_per_kg ?? 0);
      const estimatedWeight = Number(row?.estimated_weight ?? 0);
      const actualWeight = Number(row?.actual_weight ?? 0);
      const effectiveWeight = actualWeight > 0 ? actualWeight : estimatedWeight;
      const total = Number(row?.transaction?.total_amount ?? (unitPrice * effectiveWeight));
      const statusLogs = Array.isArray(row?.status_logs) ? row.status_logs : [];

      setSelectedOrder((prev) => {
        if (!prev || prev.rawId !== order.rawId) return prev;

        return {
          ...prev,
          service: row?.service?.name ?? prev.service,
          backend_status: row?.status ?? prev.backend_status,
          status: STATUS_LABEL_MAP[row?.status] ?? prev.status,
          weight: estimatedWeight || prev.weight,
          actual_weight: actualWeight || prev.actual_weight,
          price: total,
          estimated_price: unitPrice * estimatedWeight,
          paymentMethod: (row?.payment_method || prev.paymentMethod || '').toUpperCase(),
          payment_status: row?.transaction?.payment?.status === 'success' || row?.status === 'completed' ? 'paid' : 'unpaid',
          pickupAddress: row?.pickup_address ?? prev.pickupAddress,
          deliveryAddress: row?.delivery_address ?? row?.pickup_address ?? prev.deliveryAddress,
          pickupDate: formatDate(row?.pickup_date),
          pickupTime: formatTime(row?.pickup_time),
          notes: row?.notes || prev.notes,
          orderType: row?.order_type ?? prev.orderType,
          photo_pickup_url: toStorageUrl(row?.photo_pickup),
          photo_delivery_url: toStorageUrl(row?.photo_delivery),
          photos: {
            pickup: toStorageUrl(row?.photos?.pickup ?? row?.photo_pickup),
            scale: toStorageUrl(row?.photos?.scale ?? row?.photo_scale),
            delivery: toStorageUrl(row?.photos?.delivery ?? row?.photo_delivery),
          },
          status_logs: statusLogs,
          created_at: row?.created_at || prev.created_at,
          timeline: buildTimeline(row?.status, row?.order_type, statusLogs, row?.created_at),
        };
      });
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Gagal memuat detail order');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handlePaymentQris = (order) => {
    setTrackingOrder(null);
    setPaymentOrder(order);
  };

  const handlePaymentSuccess = (paymentData) => {
    // Refresh order data setelah pembayaran berhasil
    if (paymentOrder?.rawId) {
      openTrackingOrder({ ...paymentOrder, rawId: paymentOrder.rawId });
    }
    setPaymentOrder(null);
  };

  return (
    <Layout>
      <div className="order-history-page">
        <PageTitle title="Order History" subtitle="View and track all your past orders." />

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <div className="history-error">
            {error}
          </div>
        )}

        {actionError && (
          <div className="history-error">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="history-loading">Memuat riwayat pesanan...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Clock size={32} />
            </div>
            <p className="empty-title">No orders found</p>
            <p className="empty-sub">Belum ada order untuk filter ini</p>
          </div>
        ) : (
          <div className="order-list">
            {filtered.map(order => (
              <div key={order.id} className="order-card">
                <div
                  className="order-card-main"
                  onClick={() => openOrderDetail(order)}
                >
                  <div className="order-card-left">
                    <div className="order-icon">
                      <Clock size={20} />
                    </div>
                    <div className="order-info">
                      <div className="order-id-row">
                        <p className="order-id">{order.id}</p>
                        {detailLoadingId === order.rawId && <span className="order-loading-inline">Memuat detail...</span>}
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="order-meta">
                        {order.date} · {order.service} · {order.verified ? order.actual_weight : order.weight}kg
                      </p>
                    </div>
                  </div>
                  <div className="order-card-right">
                    <p className="order-price">
                      {order.verified
                        ? formatRp(order.price)
                        : `~${formatRp(order.estimated_price || order.price)}`}
                    </p>
                    <ChevronRight size={16} className="chevron-icon" />
                  </div>
                </div>

                {/* Track button */}
                {TRACKABLE_BACKEND_STATUS.has(String(order.backend_status || '').toLowerCase()) && (
                  <div className="order-card-footer">
                    <button
                      className="track-btn"
                      onClick={() => openTrackingOrder(order)}
                      disabled={trackingLoadingId === order.rawId}
                    >
                      <Truck size={14} /> {trackingLoadingId === order.rawId ? 'Membuka...' : 'Track Order'}
                    </button>
                    {isPendingOrder(order) && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingId === order.rawId}
                      >
                        {cancellingId === order.rawId ? 'Membatalkan...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={() => handleCancelOrder(selectedOrder)}
          canCancel={isPendingOrder(selectedOrder)}
          cancelling={cancellingId === selectedOrder?.rawId}
        />
        {trackingOrder && (
          <TrackOrderModal
            order={trackingOrder}
            onClose={() => setTrackingOrder(null)}
            onCancel={() => handleCancelOrder(trackingOrder)}
            canCancel={isPendingOrder(trackingOrder)}
            cancelling={cancellingId === trackingOrder?.rawId}
            onPayQris={handlePaymentQris}
          />
        )}

        {cancelCandidate && (
          <div className="cancel-modal-overlay" onClick={() => setCancelCandidate(null)}>
            <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="cancel-modal-title">Batalkan Pesanan?</h3>
              <p className="cancel-modal-text">
                Pesanan <strong>{cancelCandidate.order_number || cancelCandidate.id}</strong> belum dikonfirmasi.
                Jika dibatalkan, pesanan tidak bisa dilanjutkan.
              </p>
              <div className="cancel-modal-actions">
                <button
                  type="button"
                  className="cancel-modal-btn cancel-modal-btn-secondary"
                  onClick={() => setCancelCandidate(null)}
                  disabled={cancellingId === cancelCandidate.rawId}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  className="cancel-modal-btn cancel-modal-btn-danger"
                  onClick={confirmCancelOrder}
                  disabled={cancellingId === cancelCandidate.rawId}
                >
                  {cancellingId === cancelCandidate.rawId ? 'Membatalkan...' : 'Ya, Batalkan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {paymentOrder && (
          <PaymentQrisModal
            order={paymentOrder}
            onClose={() => setPaymentOrder(null)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </Layout>
  );
}