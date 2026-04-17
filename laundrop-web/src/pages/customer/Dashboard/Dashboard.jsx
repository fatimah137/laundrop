import { useState } from 'react';
import { ShoppingBag, CheckCircle, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import Layout from '../../../components/Customer/Layout';
import StatCard from '../../../components/Customer/Dashboard/StatCard';
import OrderCard from '../../../components/Customer/Dashboard/OrderCard';
import ServiceCards from '../../../components/Customer/Dashboard/ServiceCards';
import QuickActions from '../../../components/Customer/Dashboard/QuickActions';
import './Dashboard.css';

export default function Dashboard() {
  const { activeOrders, completedOrders, totalSpending, orders, profile } = useApp();
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Logika Ucapan Selamat
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      <div className="dashboard-container">
        
        {/* 1. Greeting Banner */}
        <section className="greeting-banner">
          <div className="greeting-content">
            <p className="greeting-subtitle">{greeting},</p>
            <h2 className="greeting-title">{profile?.name || 'User'} 👋</h2>
            <p className="greeting-description">
              You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''} right now.
            </p>
          </div>
        </section>

        {/* 2. Stats Grid */}
        <section className="stats-grid">
          <StatCard 
            icon={ShoppingBag} 
            label="Active Orders" 
            value={activeOrders.length} 
            colorClass="blue" 
          />
          <StatCard 
            icon={CheckCircle} 
            label="Completed Orders" 
            value={completedOrders.length} 
            colorClass="green" 
          />
          <StatCard 
            icon={DollarSign} 
            label="Total Spending" 
            value={`$${totalSpending.toFixed(2)}`} 
            colorClass="purple" 
          />
        </section>

        {/* 3. Active Orders Section */}
        {activeOrders.length > 0 && (
          <section className="content-card">
            <div className="card-header">
              <h3>Active Orders</h3>
              <span className="badge-blue">{activeOrders.length} active</span>
            </div>
            <div className="card-body no-padding">
              {activeOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onTrack={(o) => setTrackingOrder(o)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* 4. Services Section */}
        <section className="content-card">
          <div className="card-header">
            <h3>Available Services</h3>
          </div>
          <div className="card-body">
            <ServiceCards />
            </div>
        </section>

        {/* 5. Quick Actions */}
        <QuickActions />

        {/* 6. Recent Orders Section */}
        <section className="content-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Link to="/history" className="view-all-link">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card-body no-padding">
            {orders.slice(0, 3).map(order => (
              <div key={order.id} className="recent-order-item">
                <div className="recent-info">
                  <p className="recent-id">{order.id}</p>
                  <p className="recent-sub">{order.date} · {order.service}</p>
                </div>
                <div className="recent-right">
                   <span className={`status-text ${order.status.toLowerCase()}`}>{order.status}</span>
                   <span className="recent-price">${order.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}