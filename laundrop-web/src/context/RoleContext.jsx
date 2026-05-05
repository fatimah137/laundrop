import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext(null);

const ROLE_PERMISSIONS = {
  owner: {
    label: 'Owner',
    menus: ['dashboard', 'orders', 'customers', 'services', 'payment', 'reports', 'notifications', 'profile', 'settings', 'tracking'],
  },
  employee: {
    label: 'Employee',
    menus: ['dashboard', 'orders', 'notifications', 'profile'],
  },
};

const STORAGE_KEY = 'laundrop_role';

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return saved && ROLE_PERMISSIONS[saved] ? saved : 'owner';
  });

  const [currentUser] = useState({
    name: 'Alex Tanaka',
    email: 'alex@laundrop.id',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  const setRole = (newRole) => {
    if (ROLE_PERMISSIONS[newRole]) setRoleState(newRole);
  };

  const can = (menu) => ROLE_PERMISSIONS[role]?.menus.includes(menu);

  return (
    <RoleContext.Provider value={{ role, setRole, can, roleLabel: ROLE_PERMISSIONS[role]?.label, currentUser, allRoles: Object.keys(ROLE_PERMISSIONS) }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}