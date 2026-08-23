import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CustomerOrder from './pages/CustomerOrder.jsx'
import OrderTracking from './pages/OrderTracking.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<CustomerOrder />} />
        <Route path="/track/:orderId" element={<OrderTracking />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  )
}
