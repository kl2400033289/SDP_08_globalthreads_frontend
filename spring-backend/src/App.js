import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ArtisanDashboard from "./pages/ArtisanDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import MarketingDashboard from "./pages/MarketingDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import OrderHistory from "./pages/OrderHistory";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Toaster position="top-right" />

      <Routes>
        {/* public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
            </ProtectedRoute>
          }
           />
        <Route path="/payment" element={<Payment />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/artisan" element={<ArtisanDashboard />} /> 


        {/* 🔐 protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/artisan"
          element={
            <ProtectedRoute allowedRoles={["artisan"]}>
              <ArtisanDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer"
          element={
            <ProtectedRoute allowedRoles={["buyer"]}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketing"
          element={
            <ProtectedRoute allowedRoles={["marketing"]}>
              <MarketingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/orders"
  element={
    <ProtectedRoute allowedRoles={["buyer"]}>
      <OrderHistory />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;