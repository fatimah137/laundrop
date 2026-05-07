import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { RoleProvider } from './context/RoleContext'
import ProtectedRoute from './components/ProtectedRoute'

// Layout
import AppLayout from './components/Dashboard/Layout/AppLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ResetSuccess from './pages/auth/ResetSucces'

// Landing
import Home from './pages/Home'

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard/Dashboard'
import CustomerOrder from './pages/customer/Order/Order'
import CustomerHistory from './pages/customer/History/History'
import CustomerNotification from './pages/customer/Notification/Notification'
import CustomerProfile from './pages/customer/Profile/Profile'
import CustomerSetting from './pages/customer/Setting/Setting'

// Dashboard Pages (Owner & Employee)
import OwnerDashboard from './pages/dashboard/OwnerDashboard/OwnerDashboard'
import Orders from './pages/dashboard/Orders/Orders'
import Customers from './pages/dashboard/Customers/Customers'
import Services from './pages/dashboard/Services/Services'
import Payment from './pages/dashboard/Payment/Payment'
import Notifications from './pages/dashboard/Notifications/Notifications'
import Employees from './pages/dashboard/Employees/Employees'
import Profile from './pages/dashboard/Profile/Profile'
import Settings from './pages/dashboard/Settings/Settings'
import Reports from './pages/dashboard/Reports/Reports'

import './App.css'

function App() {
  return (
    <AppProvider>
      <RoleProvider>
        <BrowserRouter>
          <Routes>

            {/* ─── Landing ─── */}
            <Route path="/" element={<Home />} />

            {/* ─── Auth ─── */}
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-success"  element={<ResetSuccess />} />

            {/* ─── Customer ─── */}
            <Route path="/customer" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/order" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerOrder />
              </ProtectedRoute>
            } />
            <Route path="/customer/history" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerHistory />
              </ProtectedRoute>
            } />
            <Route path="/customer/notification" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerNotification />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/customer/setting" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerSetting />
              </ProtectedRoute>
            } />

            {/* ─── Owner ─── */}
            <Route path="/owner" element={
              <ProtectedRoute allowedRoles={['owner']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"     element={<OwnerDashboard />} />
              <Route path="orders"        element={<Orders />} />
              <Route path="customers"     element={<Customers />} />
              <Route path="services"      element={<Services />} />
              <Route path="payment"       element={<Payment />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="employees"     element={<Employees />} />
              <Route path="profile"       element={<Profile />} />
              <Route path="settings"      element={<Settings />} />
              <Route path="reports"       element={<Reports />} />
            </Route>

            {/* ─── Employee ─── */}
            <Route path="/employee" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"     element={<OwnerDashboard />} />
              <Route path="orders"        element={<Orders />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile"       element={<Profile />} />
            </Route>

            {/* ─── Fallback ─── */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </AppProvider>
  )
}

export default App