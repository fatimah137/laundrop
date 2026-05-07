import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext(null);

const DUMMY_USERS = [
  { id: 1, name: 'Alex Tanaka',  email: 'owner@laundrop.id',  password: '1234', role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' },
  { id: 2, name: 'Siti Rahma',   email: 'emp@laundrop.id',    password: '1234', role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { id: 3, name: 'Budi Santoso', email: 'user@laundrop.id',   password: '1234', role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop' },
];

const ROLE_PERMISSIONS = {
  owner: {
    label: 'Owner',
    menus: ['dashboard', 'orders', 'customers', 'services', 'payment', 'reports', 'notifications', 'profile', 'settings', 'tracking'],
  },
  employee: {
    label: 'Employee',
    menus: ['dashboard', 'orders', 'notifications', 'profile'],
  },
  // customer tidak masuk sini — dia punya layout sendiri
};

const STORAGE_KEY = 'laundrop_user';

export function RoleProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const role = currentUser?.role ?? null;

  function login(email, password) {
    const found = DUMMY_USERS.find(
      u => u.email === email && u.password === password
    );
    if (!found) throw new Error('Email atau password salah');
    const { password: _, ...safeUser } = found;
    setCurrentUser(safeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    return safeUser;
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const can = (menu) => ROLE_PERMISSIONS[role]?.menus.includes(menu) ?? false;

  return (
    <RoleContext.Provider value={{
      role,
      currentUser,
      roleLabel: ROLE_PERMISSIONS[role]?.label ?? 'Customer',
      login,
      logout,
      can,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}