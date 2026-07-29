import { useState } from 'react';
import { Eye, MoreHorizontal, Edit, Trash2, ChevronRight } from 'lucide-react';
import StatusBadge from '../../shared/StatusBadge';
import './OrderListView.css';

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

const STATUS_BUTTON_LABEL = {
  waiting_confirmation: 'Pickup',
  pickup: 'Picked Up',
  picked_up: 'Bill',
  waiting_payment: 'Start Wash',
  washing: 'Finish Wash',
  washing_finished: 'Delivery',
  delivery: 'Complete',
};

export default function OrderListView({
  orders = [],
  employees = [],
  canManage,        // ✅ ganti dari role
  onEdit,
  onDelete,
  onViewDetail,
  onStatusChange,
  getStatusBlockReason,
  onBill,
  onConfirmCashPayment,
}) {
  const [openMenuId, setOpenMenuId]       = useState(null);

  const getEmployee = (id) => employees.find(e => e.id === id || e.name === id);

  return (
    <>
      <div className="olv-list">
        {orders.map(order => {
          const emp        = getEmployee(order.assigned_employee);
          const currentIdx = STATUS_FLOW.indexOf(order.status);
          const nextStatus = currentIdx < STATUS_FLOW.length - 1
            ? STATUS_FLOW[currentIdx + 1] : null;
          const blockReason = nextStatus
            ? (getStatusBlockReason?.(order, nextStatus) || '')
            : '';
          const canAdvance = Boolean(nextStatus) && !blockReason;
          const isMenuOpen = openMenuId === order.id;
          const canBill = order.status === 'picked_up';
          const canConfirmCashPayment =
            order.status === 'delivery' &&
            String(order.payment_method || '').toLowerCase() === 'cash' &&
            String(order.payment_status || 'unpaid').toLowerCase() !== 'paid';

          return (
            <div key={order.id} className="olv-card">
              <div className="olv-card-inner">

                {/* Info Kiri */}
                <div className="olv-info">
                  <div className="olv-badges-row">
                    <span className="olv-order-id">{order.order_number || order.order_id}</span>
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.payment_status || 'unpaid'} type="payment" />
                  </div>
                  <p className="olv-customer">{order.customer_name}</p>
                  {order.address && <p className="olv-address">{order.address}</p>}
                  {emp && (
                    <p className="olv-employee">
                      Assigned: <strong>{emp.name || order.assigned_employee}</strong>
                    </p>
                  )}
                </div>

                {/* Aksi Kanan */}
                <div className="olv-actions">
                  <span className="olv-amount">
                    Rp {(order.total_amount || 0).toLocaleString('id-ID')}
                  </span>

                  {nextStatus && (
                    <button
                      className="olv-btn-next"
                      onClick={() => {
                        if (!canAdvance) return;
                        if (order.status === 'picked_up') {
                          onBill?.(order);
                        } else {
                          onStatusChange?.(order.id, nextStatus);
                        }
                      }}
                      disabled={!canAdvance}
                      title={blockReason}
                    >
                      <ChevronRight size={13} />
                      {STATUS_BUTTON_LABEL[order.status] || 'Next'}
                    </button>
                  )}

                  {canConfirmCashPayment && (
                    <button
                      className="olv-btn-cash-paid"
                      onClick={() => onConfirmCashPayment?.(order)}
                    >
                      Pembayaran Diterima
                    </button>
                  )}

                  {/* Dropdown ... */}
                  <div className="olv-dropdown-wrap">
                    <button
                      className="olv-menu-btn"
                      onClick={() => setOpenMenuId(isMenuOpen ? null : order.id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="olv-dropdown-backdrop"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="olv-dropdown">

                          <button
                            className="olv-dropdown-item"
                            onClick={() => {
                              onViewDetail?.(order);
                              setOpenMenuId(null);
                            }}
                          >
                            <Eye size={14} /> View Detail
                          </button>

                          {/* ✅ canManage berlaku untuk owner DAN employee */}
                          {canManage && (
                            <>
                              <div className="olv-dropdown-divider" />
                              <button
                                className="olv-dropdown-item"
                                onClick={() => { onEdit?.(order); setOpenMenuId(null); }}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <div className="olv-dropdown-divider" />
                              <button
                                className="olv-dropdown-item danger"
                                onClick={() => { onDelete?.(order.id); setOpenMenuId(null); }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </>
                          )}

                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}