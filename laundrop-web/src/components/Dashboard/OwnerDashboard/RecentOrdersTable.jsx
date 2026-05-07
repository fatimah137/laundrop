import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import StatusBadge from "../../shared/StatusBadge";
import { formatIDR, formatDate } from "../../../data/format";
import './RecentOrdersTable.css';

export default function RecentOrdersTable({ orders = [] }) {
  const recent = orders.slice(0, 6);

  return (
    <div className="rot-card">
      {/* Header */}
      <div className="rot-header">
        <div>
          <h3 className="rot-title">Recent Orders</h3>
          <p className="rot-subtitle">Latest activity</p>
        </div>
        <Link to="/owner/orders" className="rot-view-all">
          View all <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Table */}
      <div className="rot-table-wrap">
        <table className="rot-table">
          <thead>
            <tr className="rot-thead-row">
              <th className="rot-th">Order</th>
              <th className="rot-th">Customer</th>
              <th className="rot-th">Service</th>
              <th className="rot-th">Date</th>
              <th className="rot-th">Amount</th>
              <th className="rot-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(o => (
              <tr key={o.id} className="rot-tbody-row">
                <td className="rot-td rot-order-num">{o.order_number || `#-${o.id}`}</td>
                <td className="rot-td rot-customer">{o.customer_name}</td>
                <td className="rot-td rot-muted">{o.service_name || 'Laundry'}</td>
                <td className="rot-td rot-muted">{formatDate(o.pickup_date || o.created_date)}</td>
                <td className="rot-td rot-amount">{formatIDR(o.total_amount)}</td>
                <td className="rot-td">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="rot-empty">No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}