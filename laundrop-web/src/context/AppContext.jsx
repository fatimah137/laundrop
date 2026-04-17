import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Data dummy agar Dashboard tidak kosong saat pertama kali dibuka
  const [profile] = useState({
    name: "Desyana Dewi",
    email: "desyana.dewi@example.com"
  });

  const [activeOrders] = useState([
    {
      id: "ORD-7721",
      status: "On Progress",
      price: 25.50,
      pickupDate: "Oct 24, 2023",
      pickupTime: "10:00 AM",
      pickupAddress: "123 Maple Street, Springfield"
    }
  ]);

  const [orders] = useState([
    { id: "ORD-7720", date: "Oct 20", service: "Wash & Fold", status: "completed", price: 15.00 },
    { id: "ORD-7719", date: "Oct 18", service: "Dry Cleaning", status: "completed", price: 30.00 }
  ]);

  const unreadCount = 3;
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalSpending = orders.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <AppContext.Provider value={{ 
      profile, 
      activeOrders, 
      orders, 
      unreadCount, 
      completedOrders, 
      totalSpending 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);