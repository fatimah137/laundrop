import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const formatRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

function generateOrderId() {
  const now = new Date();
  const dd  = String(now.getDate()).padStart(2, '0');
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const num = String(Math.floor(Math.random() * 90000) + 10000);
  return `LD-${dd}${mm}-${num}`;
}

// Status flow lengkap
export const ORDER_STATUSES = [
  'Waiting Pickup',
  'Pickup',
  'Waiting Payment',
  'Processing',
  'Ready',
  'Delivery',
  'Completed',
  'Cancelled',
];

export const AppProvider = ({ children }) => {

  const [orders, setOrders] = useState([
    {
      id:              "ORD-7721",
      order_number:    "LD-260424-7721",
      service:         "Cuci + Setrika",
      status:          "Processing",
      payment_status:  "paid",
      verified:        true,
      price:           30000,
      estimated_price: 30000,
      actual_weight:   3,
      date:            "24 Okt 2023",
      pickupTime:      "10:00",
      pickupAddress:   "Jl. Mawar No. 123, Semarang",
      deliveryAddress: "Jl. Mawar No. 123, Semarang",
      weight:          3,
      clothesCount:    "5",
      items:           ["Shirts", "Pants"],
      notes:           "",
      paymentMethod:   "Cash",
      createdAt:       "2023-10-24T10:00:00.000Z",
    },
    {
      id:              "ORD-7720",
      order_number:    "LD-201023-7720",
      service:         "Setrika Saja",
      status:          "Completed",
      payment_status:  "paid",
      verified:        true,
      price:           15000,
      estimated_price: 15000,
      actual_weight:   2,
      date:            "20 Okt 2023",
      pickupTime:      "10:00",
      pickupAddress:   "Jl. Mawar No. 123, Semarang",
      deliveryAddress: "Jl. Mawar No. 123, Semarang",
      weight:          2,
      clothesCount:    "4",
      items:           ["Shirts"],
      notes:           "",
      paymentMethod:   "Cash",
      createdAt:       "2023-10-20T10:00:00.000Z",
    },
    {
      id:              "ORD-7719",
      order_number:    "LD-181023-7719",
      service:         "Cuci Kering",
      status:          "Completed",
      payment_status:  "paid",
      verified:        true,
      price:           120000,
      estimated_price: 120000,
      actual_weight:   2,
      date:            "18 Okt 2023",
      pickupTime:      "11:00",
      pickupAddress:   "Jl. Mawar No. 123, Semarang",
      deliveryAddress: "Jl. Mawar No. 123, Semarang",
      weight:          2,
      clothesCount:    "3",
      items:           ["Suits"],
      notes:           "",
      paymentMethod:   "QRIS",
      createdAt:       "2023-10-18T11:00:00.000Z",
    },
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: "Pesanan ORD-7721 sudah dijemput dan sedang diproses.", time: "24 Okt 2023 · 11:30", read: false },
    { id: 2, message: "Pesanan ORD-7720 telah berhasil dikirim.",             time: "21 Okt 2023 · 11:00", read: false },
    { id: 3, message: "Pesanan ORD-7719 siap untuk dikirim.",                 time: "20 Okt 2023 · 09:00", read: false },
  ]);

  const activeOrders    = orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled");
  const completedOrders = orders.filter(o => o.status === "Completed");
  const totalSpending   = orders.filter(o => o.payment_status === "paid").reduce((acc, o) => acc + (o.price || 0), 0);
  const unreadCount     = notifications.filter(n => !n.read).length;

  function pushNotif(message) {
    setNotifications(prev => [{
      id:   Date.now(),
      message,
      time: new Date().toLocaleString("id-ID"),
      read: false,
    }, ...prev]);
  }

  // Customer buat order — status awal Waiting Pickup, belum verified
  function addOrder(orderData) {
    const orderId  = generateOrderId();
    const newOrder = {
      ...orderData,
      id:              orderId,
      order_number:    orderId,
      date:            new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      status:          "Waiting Pickup", // ✅ status awal yang benar
      payment_status:  "unpaid",
      verified:        false,            // ✅ belum diverifikasi employee
      estimated_price: orderData.price,  // ✅ simpan estimasi harga
      actual_weight:   null,             // ✅ diisi employee saat verifikasi
      createdAt:       new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    pushNotif(`Pesanan ${orderId} berhasil dibuat. Menunggu penjemputan.`);
    return newOrder;
  }

  // Employee verifikasi setelah pickup — update berat aktual & harga final
  // Kalau QRIS → status jadi Waiting Payment
  // Kalau COD  → status langsung Processing
  function verifyOrder(orderId, { actual_weight, actual_clothes, final_price }) {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const nextStatus = o.paymentMethod === 'QRIS' ? 'Waiting Payment' : 'Processing';
      return {
        ...o,
        verified:       true,
        actual_weight,
        actual_clothes,
        price:          final_price,
        status:         nextStatus,
      };
    }));
    const order = orders.find(o => o.id === orderId);
    pushNotif(
      order?.paymentMethod === 'QRIS'
        ? `Pesanan ${orderId} sudah dijemput. Silakan selesaikan pembayaran QRIS.`
        : `Pesanan ${orderId} sudah dijemput dan sedang diproses.`
    );
  }

  // Customer bayar QRIS → payment_status paid → status Processing
  function confirmPayment(orderId) {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, payment_status: 'paid', status: 'Processing' }
        : o
    ));
    pushNotif(`Pembayaran ${orderId} berhasil dikonfirmasi. Laundry mulai diproses.`);
  }

  // Update status order (oleh employee)
  function updateOrderStatus(orderId, status) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    pushNotif(`Status pesanan ${orderId} diperbarui menjadi ${status}.`);
  }

  function deleteOrder(orderId) {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }

  function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <AppContext.Provider value={{
      orders,
      activeOrders,
      completedOrders,
      totalSpending,
      notifications,
      unreadCount,
      addOrder,
      verifyOrder,       // ✅ baru — dipakai employee di dashboard
      confirmPayment,    // ✅ dipakai customer setelah QRIS
      updateOrderStatus,
      deleteOrder,
      markNotificationRead,
      markAllRead,
      formatRp,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);