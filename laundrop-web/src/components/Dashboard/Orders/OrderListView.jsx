import { useState } from 'react';
import { Eye, MoreHorizontal, Edit, Trash2, ChevronRight } from 'lucide-react';
import StatusBadge from '../../shared/StatusBadge';
import OrderDetailModal from './OrderDetailModal';
import './OrderListView.css';

const STATUS_FLOW = ['pending', 'pickup', 'proses', 'siap', 'delivery', 'selesai'];

export default function OrderListView({
  orders = [],
  employees = [],
  canManage,        // ✅ ganti dari role
  onEdit,
  onDelete,
  onViewDetail,
  onStatusChange,
}) {
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);

  const getEmployee = (id) => employees.find(e => e.id === id || e.name === id);

  return (
    <>
      <div className="olv-list">
        {orders.map(order => {
          const emp        = getEmployee(order.assigned_employee);
          const currentIdx = STATUS_FLOW.indexOf(order.status);
          const nextStatus = currentIdx < STATUS_FLOW.length - 1
            ? STATUS_FLOW[currentIdx + 1] : null;
          const isMenuOpen = openMenuId === order.id;

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
                      onClick={() => onStatusChange?.(order.id, nextStatus)}
                    >
                      <ChevronRight size={13} />
                      {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
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
                              setViewingDetail(order);
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

      {viewingDetail && (
        <OrderDetailModal
          order={viewingDetail}
          onClose={() => setViewingDetail(null)}
        />
      )}
    </>
  );
}