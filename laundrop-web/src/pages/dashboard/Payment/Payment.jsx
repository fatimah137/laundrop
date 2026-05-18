import { useState, useMemo, useRef, useEffect } from 'react';
import { CreditCard, Wallet, CheckCircle, X, ChevronDown, Search } from 'lucide-react';
import { MOCK_ORDERS } from '../../../data/mockData';
import { formatIDR } from '../../../data/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import Pagination from '../../../components/shared/Pagination';
import Toast from '../../../components/shared/Toast';
import './Payment.css';

const STATUS_OPTIONS = [
  { value: 'all',    label: 'All Status'  },
  { value: 'paid',   label: 'Paid'        },
  { value: 'unpaid', label: 'Unpaid'      },
];

const METHOD_OPTIONS = [
  { value: 'all',      label: 'All Methods' },
  { value: 'cash',     label: 'Cash'        },
  { value: 'qris',     label: 'QRIS'        },
  { value: 'transfer', label: 'Transfer'    },
];

const ITEMS_PER_PAGE = 10;

const generatePayments = () =>
  MOCK_ORDERS.map(o => ({
    id:            o.id,
    order_id:      o.order_number,
    customer_name: o.customer_name,
    amount:        o.total_amount,
    status:        o.payment_status,
    method:        o.paymentMethod || 'cash',
    date:          o.pickup_date,
  }));

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
  const [payments, setPayments]         = useState(generatePayments);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    setPage(1);
    return payments.filter(p => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchMethod = methodFilter === 'all' || p.method === methodFilter;
      const matchSearch = !search ||
        p.order_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.customer_name?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchMethod && matchSearch;
    });
  }, [payments, statusFilter, methodFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalPaid   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalUnpaid = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + (p.amount || 0), 0);

  const markPaid = (id) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p));
    showToast('Pembayaran berhasil dikonfirmasi!');
  };

  return (
    <div className="pay-page">

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="pay-header">
        <h1 className="pay-title">Payment</h1>
        <p className="pay-subtitle">{filtered.length} dari {payments.length} transaksi</p>
      </div>

      {/* Summary Cards */}
      <div className="pay-summary-grid">
        <div className="pay-summary-card">
          <div className="pay-summary-icon green"><Wallet size={20} /></div>
          <div>
            <p className="pay-summary-label">Total Lunas</p>
            <p className="pay-summary-value">{formatIDR(totalPaid)}</p>
          </div>
        </div>
        <div className="pay-summary-card">
          <div className="pay-summary-icon red"><CreditCard size={20} /></div>
          <div>
            <p className="pay-summary-label">Total Belum Bayar</p>
            <p className="pay-summary-value">{formatIDR(totalUnpaid)}</p>
          </div>
        </div>
        <div className="pay-summary-card">
          <div className="pay-summary-icon blue"><CreditCard size={20} /></div>
          <div>
            <p className="pay-summary-label">Total Transaksi</p>
            <p className="pay-summary-value">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="pay-filter-bar">
        <div className="pay-search-wrap">
          <Search size={15} className="pay-search-icon" />
          <input
            className="pay-search-input"
            placeholder="Cari order atau customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="pay-search-clear" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="pay-filters">
          <CustomSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          <CustomSelect value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
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
                  <p className="pay-customer">{p.customer_name}</p>
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