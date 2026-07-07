import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const RoleContext = createContext(null);

const ROLE_PERMISSIONS = {
  owner: {
    label: 'Owner',
    menus: ['dashboard', 'orders', 'customers', 'employees', 'services', 'payment', 'reports', 'notifications', 'profile', 'settings', 'tracking'],
  },
  employee: {
    label: 'Employee',
    menus: ['dashboard', 'orders', 'notifications', 'profile'],
  },
  // customer tidak masuk sini — dia punya layout sendiri
};

const STORAGE_KEY = 'laundrop_user';
const TOKEN_KEY = 'auth_token';

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

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, []);

  async function login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response?.data?.data;

      if (!payload?.token || !payload?.user) {
        throw new Error('Respons login tidak valid');
      }

      const user = payload.user;
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, payload.token);
      api.defaults.headers.common.Authorization = `Bearer ${payload.token}`;

      return user;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Login gagal';
      throw new Error(message);
    }
  }

  async function loginWithGoogle(idToken) {
    try {
      const response = await api.post('/auth/google', { id_token: idToken });
      const payload = response?.data?.data;

      if (!payload?.token || !payload?.user) {
        throw new Error('Respons Google login tidak valid');
      }

      const user = payload.user;
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, payload.token);
      api.defaults.headers.common.Authorization = `Bearer ${payload.token}`;

      return user;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Google login gagal';
      throw new Error(message);
    }
  }

  async function logout() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      try {
        await api.post('/auth/logout');
      } catch {
        // abaikan error logout, tetap bersihkan sesi lokal
      }
    }

    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }

  const can = (menu) => ROLE_PERMISSIONS[role]?.menus.includes(menu) ?? false;

  return (
    <RoleContext.Provider value={{
      role,
      currentUser,
      roleLabel: ROLE_PERMISSIONS[role]?.label ?? 'Customer',
      login,
      loginWithGoogle,
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