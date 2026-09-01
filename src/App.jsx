import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";

// Storefront
import Navbar from "./components/storefront/Navbar";
import RequireAuth from "./components/RequireAuth";

// Auth (

// Admin
import AdminRoute from "./components/admin/AdminRoute";
import Footer from "./components/storefront/Footer";

const Home = lazy(() => import("./pages/shop/Home"));
const ProductList = lazy(() => import("./pages/shop/ProductList"));
const ProductDetail = lazy(() => import("./pages/shop/ProductDetail"));
const Category = lazy(() => import("./pages/shop/Category"));
const Brand = lazy(() => import("./pages/shop/Brands"));
const Cart = lazy(() => import("./pages/shop/Cart"));
const Checkout = lazy(() => import("./pages/shop/Checkout"));
const OrderHistory = lazy(() => import("./pages/shop/OrderHistory"));
const About = lazy(() => import("./pages/shop/About"));
const Contact = lazy(() => import("./pages/shop/Contact"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const Stock = lazy(() => import("./pages/admin/Stock"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Brands = lazy(() => import("./pages/admin/Brands"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));

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
              <Suspense fallback={<div className="min-h-screen bg-paper" />}>
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
                  path="/categories"
                  element={
                    <StorefrontLayout>
                      <Category />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/brands"
                  element={
                    <StorefrontLayout>
                      <Brand />
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
                <Route
                  path="/about"
                  element={
                    <StorefrontLayout>
                      <About />
                    </StorefrontLayout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <StorefrontLayout>
                      <Contact />
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
                  <Route path="/admin/stock" element={<Stock />} />
                  <Route path="/admin/categories" element={<Categories />} />
                  <Route path="/admin/brands" element={<Brands />} />
                  <Route path="/admin/orders" element={<Orders />} />
                  <Route path="/admin/reviews" element={<Reviews />} />
                </Route>
                </Routes>
              </Suspense>
            </ConfirmProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
