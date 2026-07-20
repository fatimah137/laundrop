import { useState, useMemo, useRef, useEffect } from 'react';
import { CreditCard, Wallet, CheckCircle, X, ChevronDown, Search } from 'lucide-react';
import api from '../../../services/api';
import { formatIDR } from '../../../data/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import Pagination from '../../../components/shared/Pagination';
import Toast from '../../../components/shared/Toast';
import EmptyState from '../../../components/shared/EmptyState';
import './Payment.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'qris', label: 'QRIS' },
];

const ITEMS_PER_PAGE = 10;

function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="pay-custom-select" ref={ref}>
      <button
        type="button"
        className={`pay-select-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={14} className={`pay-select-chevron ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="pay-select-dropdown">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`pay-select-option ${value === opt.value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <CheckCircle size={14} className="pay-select-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_paid: 0, total_unpaid: 0, total_transactions: 0 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/payments', {
        params: {
          per_page: 100,
          search,
          status: statusFilter,
          method: methodFilter,
        },
      });

      const payload = response?.data?.data ?? {};
      const rows = payload?.items?.data ?? [];
      setPayments(Array.isArray(rows) ? rows : []);
      setSummary(payload?.summary ?? { total_paid: 0, total_unpaid: 0, total_transactions: 0 });
    } catch (error) {
      setPayments([]);
      setSummary({ total_paid: 0, total_unpaid: 0, total_transactions: 0 });
      showToast(error?.response?.data?.message || 'Gagal memuat data pembayaran', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, methodFilter, search]);

  const filtered = useMemo(() => payments, [payments]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const markPaid = async (transactionId) => {
    try {
      await api.patch(`/admin/payments/${transactionId}/mark-paid`);
      showToast('Pembayaran berhasil dikonfirmasi!');
      await loadPayments();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Gagal mengubah status pembayaran', 'danger');
    }
  };

  return (
    <div className="pay-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="pay-header">
        <h1 className="pay-title">Payment</h1>
        <p className="pay-subtitle">{filtered.length} dari {summary.total_transactions} transaksi</p>
      </div>

      <div className="pay-summary-grid">
        <div className="pay-summary-card">
          <div className="pay-summary-icon green"><Wallet size={20} /></div>
          <div>
            <p className="pay-summary-label">Total Lunas</p>
            <p className="pay-summary-value">{formatIDR(summary.total_paid || 0)}</p>
          </div>
        </div>
        <div className="pay-summary-card">
          <div className="pay-summary-icon red"><CreditCard size={20} /></div>
          <div>
            <p className="pay-summary-label">Total Belum Bayar</p>
            <p className="pay-summary-value">{formatIDR(summary.total_unpaid || 0)}</p>
          </div>
        </div>
        <div className="pay-summary-card">
          <div className="pay-summary-icon blue"><CreditCard size={20} /></div>
          <div>
            <p className="pay-summary-label">Total Transaksi</p>
            <p className="pay-summary-value">{summary.total_transactions || 0}</p>
          </div>
        </div>
      </div>

      <div className="pay-filter-bar">
        <div className="pay-search-wrap">
          <Search size={15} className="pay-search-icon" />
          <input
            className="pay-search-input"
            placeholder="Cari order atau customer..."
            value={search}
            onChange={e => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          {search && (
            <button className="pay-search-clear" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="pay-filters">
          <CustomSelect
            value={statusFilter}
            onChange={(value) => {
              setPage(1);
              setStatusFilter(value);
            }}
            options={STATUS_OPTIONS}
          />
          <CustomSelect
            value={methodFilter}
            onChange={(value) => {
              setPage(1);
              setMethodFilter(value);
            }}
            options={METHOD_OPTIONS}
          />
        </div>
      </div>

      {loading ? (
        <EmptyState title="Loading payment data..." />
      ) : filtered.length === 0 ? (
        <div className="pay-empty">
          <p>Tidak ada data pembayaran ditemukan.</p>
        </div>
      ) : (
        <>
          <div className="pay-list">
            {paginated.map(p => (
              <div key={p.id} className={`pay-card ${p.status === 'unpaid' ? 'unpaid' : ''}`}>
                <div className="pay-card-left">
                  <div className="pay-card-top">
                    <span className="pay-order-id">{p.order_id}</span>
                    <StatusBadge status={p.status} type="payment" />
                  </div>
                  <p className="pay-customer">{p.customer_name || '-'}</p>
                  <p className="pay-method">
                    Metode: <strong>{(p.method || 'N/A').toUpperCase()}</strong>
                    {p.date && <span className="pay-date"> · {p.date}</span>}
                  </p>
                </div>
                <div className="pay-card-right">
                  <span className="pay-amount">{formatIDR(p.amount || 0)}</span>
                  {p.status === 'unpaid' && (
                    <button className="pay-btn-paid" onClick={() => markPaid(p.id)}>
                      <CheckCircle size={14} /> Mark Paid
                    </button>
                  )}
                  {p.status === 'paid' && (
                    <span className="pay-paid-label">
                      <CheckCircle size={13} /> Lunas
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination current={page} total={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
