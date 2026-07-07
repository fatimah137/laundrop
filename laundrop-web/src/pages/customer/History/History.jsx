import { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronRight, Truck } from 'lucide-react';
import Layout from '../../../components/Customer/Layout';
import PageTitle from '../../../components/ui/PageTitle';
import StatusBadge from '../../../components/ui/StatusBadge';
import OrderDetailModal from '../../../components/Customer/Orders/OrderDetailModal';
import TrackOrderModal from '../../../components/Customer/Orders/TrackOrderModal';
import api from '../../../services/api';
import { formatRp } from '../../../context/AppContext';
import './History.css';

const FILTERS = ['All', 'Pending', 'On Progress', 'Completed', 'Cancelled'];

const STATUS_LABEL_MAP = {
  pending: 'Pending',
  confirmed: 'Pending',
  picking_up: 'On Progress',
  picked_up: 'On Progress',
  billed: 'On Progress',
  paid: 'On Progress',
  processing: 'On Progress',
  ready: 'On Progress',
  delivering: 'On Progress',
  delivered: 'Completed',
  cancelled: 'Cancelled',
};

const TRACKABLE_BACKEND_STATUS = new Set([
  'pending',
  'confirmed',
  'picking_up',
  'picked_up',
  'billed',
  'paid',
  'processing',
  'ready',
  'delivering',
]);

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

function buildTimeline(status) {
  const key = String(status || '').toLowerCase();
  const isCancelled = key === 'cancelled';

  const steps = [
    { key: 'pending', label: 'Order dibuat' },
    { key: 'picked_up', label: 'Pakaian dijemput' },
    { key: 'processing', label: 'Laundry diproses' },
    { key: 'delivering', label: 'Dalam pengantaran' },
    { key: 'delivered', label: 'Selesai' },
  ];

  const progressRank = {
    pending: 1,
    confirmed: 1,
    picking_up: 2,
    picked_up: 2,
    billed: 3,
    paid: 3,
    processing: 3,
    ready: 3,
    delivering: 4,
    delivered: 5,
    cancelled: 0,
  };

  const rank = progressRank[key] ?? 1;

  if (isCancelled) {
    return [
      { label: 'Order dibuat', done: true, time: '' },
      { label: 'Dibatalkan', done: true, time: '' },
    ];
  }

  return steps.map((step, index) => ({
    label: step.label,
    done: index + 1 <= rank,
    time: '',
  }));
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/orders', { params: { per_page: 100 } });
        const rows = response?.data?.data?.data ?? [];

        const mapped = rows.map((row) => {
          const unitPrice = Number(row?.service?.price_per_kg ?? 0);
          const estimatedWeight = Number(row?.estimated_weight ?? 0);
          const actualWeight = Number(row?.actual_weight ?? 0);
          const effectiveWeight = actualWeight > 0 ? actualWeight : estimatedWeight;
          const total = unitPrice * effectiveWeight;

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
            payment_status: row?.status === 'delivered' ? 'paid' : 'unpaid',
            verified: actualWeight > 0,
            estimated_price: unitPrice * estimatedWeight,
            deliveryAddress: row?.pickup_address ?? '-',
            notes: row?.notes || '',
            timeline: buildTimeline(row?.status),
          };
        });

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

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return orders;
    return orders.filter((o) => o.status === filter);
  }, [filter, orders]);

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
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-card-left">
                    <div className="order-icon">
                      <Clock size={20} />
                    </div>
                    <div className="order-info">
                      <div className="order-id-row">
                        <p className="order-id">{order.id}</p>
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
                      onClick={() => setTrackingOrder(order)}
                    >
                      <Truck size={14} /> Track Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        {trackingOrder && (
          <TrackOrderModal
            order={trackingOrder}
            onClose={() => setTrackingOrder(null)}
          />
        )}
      </div>
    </Layout>
  );
}