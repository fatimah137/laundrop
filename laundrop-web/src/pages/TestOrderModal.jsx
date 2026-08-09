import { useState } from 'react';
import OrderDetailModal from '../components/Customer/Orders/OrderDetailModal';

export default function TestOrderModal() {
  const [showModal, setShowModal] = useState(true);

  const mockOrder = {
    id: '#LAUN-2024-001',
    service: 'Laundry Express',
    date: '09/08/2026 · 10:00',
    weight: '4 kg',
    status: 'waiting_payment',
    price: 83000,
    laundryPrice: 75000,
    extraFee: 8000,
    pickupAddress: 'Jalan Keruing Raya, RW 17, Srondol Wetan, Banyumanik, Kota Semarang, Jawa Tengah, 50259, Indonesia',
    deliveryAddress: 'Jalan Keruing Raya, RW 17, Srondol Wetan, Banyumanik, Kota Semarang, Jawa Tengah, 50259, Indonesia',
    items: ['Kemeja', 'Celana', 'Jaket', 'Kaos Dalam'],
    notes: 'jangan pakai pemutih',
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test OrderDetailModal - Scrollable</h1>
      <p>Test button di bawah untuk membuka modal dengan mock data</p>
      
      <button 
        onClick={() => setShowModal(true)}
        style={{
          padding: '12px 20px',
          fontSize: '16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Show Order Detail Modal
      </button>

      {showModal && (
        <OrderDetailModal 
          order={mockOrder} 
          onClose={() => setShowModal(false)}
          onCancel={() => alert('Cancel order')}
          canCancel={true}
        />
      )}

      <div style={{ marginTop: '40px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h3>Test Points:</h3>
        <ul>
          <li>✅ Modal should be scrollable when content overflows</li>
          <li>✅ Header should stay sticky at top</li>
          <li>✅ Close button should work</li>
          <li>✅ Modal should have proper padding for mobile navbar</li>
          <li>✅ Z-index should be 1001 (above everything)</li>
          <li>✅ Position from top on tablet/mobile (not centered)</li>
          <li>✅ Responsive on different screen sizes</li>
        </ul>
      </div>
    </div>
  );
}
