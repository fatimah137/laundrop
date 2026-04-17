import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext' // 1. Import Provider
import Home from './pages/Home'
import Dashboard from './pages/customer/Dashboard/Dashboard'

// AUTH Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ResetSuccess from './pages/auth/ResetSucces'

import './App.css'

function App() {
  return (
    // 2. Bungkus seluruh aplikasi dengan AppProvider
    <AppProvider> 
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
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App