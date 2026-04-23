import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const formatRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

function generateOrderId() {
  const year = new Date().getFullYear();
  const num  = String(Math.floor(Math.random() * 900) + 100);
  return `LND-${year}-${num}`;
}

export const AppProvider = ({ children }) => {

  const [profile] = useState({
    name:  "Desyana Dewi",
    email: "desyana.dewi@example.com",
  });

  const [orders, setOrders] = useState([
    {
      id:              "ORD-7721",
      service:         "Cuci + Setrika",
      status:          "On Progress",
      price:           30000,
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
      timeline: [
        { label: "Order Diterima",  time: "24 Okt, 10:00", done: true  },
        { label: "Dijemput",        time: "24 Okt, 11:30", done: true  },
        { label: "Sedang Dicuci",   time: null,            done: false },
        { label: "Siap Dikirim",    time: null,            done: false },
        { label: "Terkirim",        time: null,            done: false },
      ],
    },
    {
      id:              "ORD-7720",
      service:         "Setrika Saja",
      status:          "Completed",
      price:           15000,
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
      timeline: [
        { label: "Order Diterima",  time: "20 Okt, 10:00", done: true },
        { label: "Dijemput",        time: "20 Okt, 11:00", done: true },
        { label: "Sedang Disetrika",time: "20 Okt, 14:00", done: true },
        { label: "Siap Dikirim",    time: "21 Okt, 09:00", done: true },
        { label: "Terkirim",        time: "21 Okt, 11:00", done: true },
      ],
    },
    {
      id:              "ORD-7719",
      service:         "Cuci Kering",
      status:          "Completed",
      price:           120000,
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
      timeline: [
        { label: "Order Diterima",  time: "18 Okt, 11:00", done: true },
        { label: "Dijemput",        time: "18 Okt, 12:00", done: true },
        { label: "Sedang Dicuci",   time: "19 Okt, 10:00", done: true },
        { label: "Siap Dikirim",    time: "20 Okt, 09:00", done: true },
        { label: "Terkirim",        time: "20 Okt, 10:30", done: true },
      ],
    },
    {
      id:              "ORD-7718",
      service:         "Express (24 Jam)",
      status:          "Completed",
      price:           45000,
      date:            "15 Okt 2023",
      pickupTime:      "09:00",
      pickupAddress:   "Jl. Mawar No. 123, Semarang",
      deliveryAddress: "Jl. Mawar No. 123, Semarang",
      weight:          3,
      clothesCount:    "6",
      items:           ["Shirts", "Pants", "Jackets"],
      notes:           "Tolong lipat dengan rapi",
      paymentMethod:   "QRIS",
      createdAt:       "2023-10-15T09:00:00.000Z",
      timeline: [
        { label: "Order Diterima",  time: "15 Okt, 09:00", done: true },
        { label: "Dijemput",        time: "15 Okt, 10:00", done: true },
        { label: "Sedang Dicuci",   time: "15 Okt, 12:00", done: true },
        { label: "Siap Dikirim",    time: "15 Okt, 20:00", done: true },
        { label: "Terkirim",        time: "16 Okt, 09:00", done: true },
      ],
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id:      1,
      message: "Pesanan ORD-7721 sudah dijemput dan sedang diproses.",
      time:    "24 Okt 2023 · 11:30",
      read:    false,
    },
    {
      id:      2,
      message: "Pesanan ORD-7720 telah berhasil dikirim.",
      time:    "21 Okt 2023 · 11:00",
      read:    false,
    },
    {
      id:      3,
      message: "Pesanan ORD-7719 siap untuk dikirim.",
      time:    "20 Okt 2023 · 09:00",
      read:    false,
    },
  ]);

  const activeOrders    = orders.filter(o => o.status !== "Completed");
  const completedOrders = orders.filter(o => o.status === "Completed");
  const totalSpending   = orders.reduce((acc, o) => acc + (o.price || 0), 0);
  const unreadCount     = notifications.filter(n => !n.read).length;

  function addOrder(orderData) {
    const newOrder = {
      ...orderData,
      id:        generateOrderId(),
      date:      new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      status:    "Pending",
      createdAt: new Date().toISOString(),
      timeline: [
        { label: "Order Diterima",  time: new Date().toLocaleString("id-ID"), done: true  },
        { label: "Dijemput",        time: null,                               done: false },
        { label: "Sedang Dicuci",   time: null,                               done: false },
        { label: "Siap Dikirim",    time: null,                               done: false },
        { label: "Terkirim",        time: null,                               done: false },
      ],
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }

  function updateOrderStatus(orderId, status) {
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status } : o)
    );
  }

  function deleteOrder(orderId) {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }

  function markNotificationRead(id) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <AppContext.Provider value={{
      profile,
      orders,
      activeOrders,
      completedOrders,
      totalSpending,
      notifications,
      unreadCount,
      addOrder,
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