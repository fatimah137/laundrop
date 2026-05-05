import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext' 
import { RoleProvider } from './context/RoleContext' 
import Home from './pages/Home'

// Layout & Wrapper
import AppLayout from './components/Dashboard/Layout/AppLayout';

// Owner Pages 
import OwnerDashboard from "./pages/dashboard/OwnerDashboard/OwnerDashboard";
import Orders from "./pages/dashboard/Orders/Orders";
import Customers from "./pages/dashboard/Customers/Customers";
import Services from "./pages/dashboard/Services/Services";
import Payment from "./pages/dashboard/Payment/Payment";
import Notifications from "./pages/dashboard/Notifications/Notifications";
import Employees from "./pages/dashboard/Employees/Employees";
import OwnerProfile from "./pages/dashboard/Profile/Profile";
import Settings from "./pages/dashboard/Settings/Settings";
import Reports from "./pages/dashboard/Reports/Reports";

// Customer Pages
import Dashboard from './pages/customer/Dashboard/Dashboard'
import Order from "./pages/customer/Order/Order";
import History from "./pages/customer/History/History";
import Notification from './pages/customer/Notification/Notification';
import CustomerProfile from './pages/customer/Profile/Profile'
import Setting from './pages/customer/Setting/Setting'

// AUTH Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ResetSuccess from './pages/auth/ResetSucces'

import './App.css'

function App() {
  return (
    <AppProvider> 
      <RoleProvider> {/* FIX: Harus membungkus BrowserRouter */}
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Home />} />
            <Route path="/landing" element={<Home />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />

            {/* Customer */}
            <Route path="/customer/dashboard" element={<Dashboard />} />
            <Route path="/customer/order" element={<Order />} />
            <Route path="/customer/history" element={<History />} />
            <Route path="/customer/notification" element={<Notification />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/setting" element={<Setting />} />

            {/* Owner/Admin - Menggunakan AppLayout agar Sidebar muncul */}
            <Route path="/owner" element={<AppLayout />}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="services" element={<Services />} />
            <Route path="payment" element={<Payment />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="employees" element={<Employees />} />
            <Route path="profile" element={<OwnerProfile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </AppProvider>
  )
}

export default App