import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LandingPage from "./Pages/LandingPage";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/login";
import ForgotPassword from "./Pages/ForgotPassword";
import SignupPage from "./Pages/signin";
import RegisterPage from "./Pages/Register";
import AboutPage from "./Pages/AboutPage";
import ContactPage from "./Pages/ContactPage";
import UserProfile from "./Pages/UserProfile";
import BrandProducts from "./Pages/BrandProducts";
import BrandDashboard from "./Pages/brands/BrandDashboard";
import OurBrands from "./Pages/OurBrands";
import AdminDashboard from "./admin/AdminDashboard";
import ManageBrands from "./admin/ManageBrands";
import ManageUsers from "./admin/ManageUsers";
import ManageProducts from "./admin/ManageProducts";
import AdminSettings from "./admin/AdminSettings";
import ManageVerifications from "./admin/ManageVerifications";
import ManageMessages from "./admin/ManageMessages";
import ManageCategories from "./admin/ManageCategories";
import ManageOrders from "./admin/ManageOrders";
import ManageColors from "./admin/ManageColors";
import ProductDetailPage from "./Pages/ProductDetailPage";
import ComparisonProduct from "./Pages/ComparisonProduct";
import ShippingPage from "./Pages/ShippingPage";
import PaymentPage from "./Pages/PaymentPage";
import OrderSuccessPage from "./Pages/OrderSuccessPage";
import WishlistPage from "./Pages/WishlistPage";
const Mall3DPage = lazy(() => import("./Pages/Mall3DPage"));
const Mall3DIonPage = lazy(() => import("./Pages/Mall3DIonPage"));
const UnityMallPage = lazy(() => import("./Pages/UnityMallPage"));
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import CartSidebar from "./components/CartSidebar";
import ProtectedRoute from "./components/ProtectedRoute";


class App extends Component {
  render() {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <WishlistProvider>
          <CartProvider>
            <CartSidebar />
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            <Routes>
              {/* =============== PUBLIC ROUTES =============== */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/brands" element={<OurBrands />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/3d-mall" element={
                <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading 3D Mall...</div>}>
                  <Mall3DPage />
                </Suspense>
              } />
              <Route path="/3d-mall-ion" element={
                <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading Cesium Mall...</div>}>
                  <Mall3DIonPage />
                </Suspense>
              } />
              <Route path="/unity-mall" element={
                <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading Unity Mall...</div>}>
                  <UnityMallPage />
                </Suspense>
              } />
              <Route path="/brand/:brandId" element={<BrandProducts />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/compare/:id" element={<ComparisonProduct />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* =============== CUSTOMER-ONLY ROUTES =============== */}
              <Route path="/profile" element={
                <ProtectedRoute requiredRole="customer">
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/checkout/shipping" element={
                <ProtectedRoute requiredRole="customer">
                  <ShippingPage />
                </ProtectedRoute>
              } />
              <Route path="/checkout/payment" element={
                <ProtectedRoute requiredRole="customer">
                  <PaymentPage />
                </ProtectedRoute>
              } />
              <Route path="/order-success" element={
                <ProtectedRoute requiredRole="customer">
                  <OrderSuccessPage />
                </ProtectedRoute>
              } />

              {/* =============== BRAND ROUTES =============== */}
              <Route path="/brand/dashboard" element={
                <ProtectedRoute requiredRole="brand">
                  <BrandDashboard />
                </ProtectedRoute>
              } />

              {/* =============== ADMIN ROUTES =============== */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/brands" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageBrands />
                </ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageCategories />
                </ProtectedRoute>
              } />
              <Route path="/admin/colors" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageColors />
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageProducts />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/verifications" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageVerifications />
                </ProtectedRoute>
              } />
              <Route path="/admin/messages" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageMessages />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute requiredRole="admin">
                  <ManageOrders />
                </ProtectedRoute>
              } />

              {/* =============== CATCH-ALL =============== */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </WishlistProvider>
      </Router>
    );
  }
}

export default App;
