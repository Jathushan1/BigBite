import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { Navbar } from './components/Navbar'
import { BranchSelectPage } from './pages/BranchSelectPage'
import { MenuPage } from './pages/MenuPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { PaymentPage } from './pages/PaymentPage'
import { OrderStatusPage } from './pages/OrderStatusPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'
import { StaffOrderListPage } from './pages/StaffOrderListPage'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BranchSelectPage />} />
              <Route path="/branch/:branchId/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/:orderId/payment" element={<PaymentPage />} />
              <Route path="/order/:orderId" element={<OrderStatusPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/staff/orders" element={<StaffOrderListPage />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </BrowserRouter>
  )
}
