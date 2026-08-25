import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";

// Storefront
import Navbar from "./components/storefront/Navbar";
import Home from "./pages/shop/Home";
import ProductList from "./pages/shop/ProductList";
import ProductDetail from "./pages/shop/ProductDetail";
import Cart from "./pages/shop/Cart";
import Checkout from "./pages/shop/Checkout";
import OrderHistory from "./pages/shop/OrderHistory";
import RequireAuth from "./components/RequireAuth";

// Auth (shared entry points)
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminRoute from "./components/admin/AdminRoute";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Categories from "./pages/admin/Categories";
import Brands from "./pages/admin/Brands";
import Orders from "./pages/admin/Orders";
import Reviews from "./pages/admin/Reviews";
import Footer from "./components/storefront/Footer";

function StorefrontLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Routes>
                {/* Storefront — public */}
                <Route
                  path="/"
                  element={
                    <StorefrontLayout>
                      <Home />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <StorefrontLayout>
                      <ProductList />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/products/:id"
                  element={
                    <StorefrontLayout>
                      <ProductDetail />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <StorefrontLayout>
                      <Cart />
                    </StorefrontLayout>
                  }
                />

                {/* Auth */}
                <Route
                  path="/login"
                  element={
                    <StorefrontLayout>
                      <Login />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <StorefrontLayout>
                      <Register />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <StorefrontLayout>
                      <ForgotPassword />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <StorefrontLayout>
                      <ResetPassword />
                    </StorefrontLayout>
                  }
                />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Storefront — requires login */}
                <Route
                  path="/checkout"
                  element={
                    <StorefrontLayout>
                      <RequireAuth>
                        <Checkout />
                      </RequireAuth>
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <StorefrontLayout>
                      <RequireAuth>
                        <OrderHistory />
                      </RequireAuth>
                    </StorefrontLayout>
                  }
                />

                {/* Admin — no Navbar/storefront chrome */}
                <Route
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/products" element={<Products />} />
                  <Route path="/admin/products/new" element={<ProductForm />} />
                  <Route
                    path="/admin/products/:id/edit"
                    element={<ProductForm />}
                  />
                  <Route path="/admin/categories" element={<Categories />} />
                  <Route path="/admin/brands" element={<Brands />} />
                  <Route path="/admin/orders" element={<Orders />} />
                  <Route path="/admin/reviews" element={<Reviews />} />
                </Route>
              </Routes>
            </ConfirmProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
