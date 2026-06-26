import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — Role-based route protection
 *
 * Roles used: "admin", "brand", "customer"
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    console.log(`[ProtectedRoute] Accessing: ${window.location.pathname} | User Role: ${role} | Required Role: ${requiredRole}`);

    // 1. No token at all → must login
    if (!token) {
        console.warn("[ProtectedRoute] No token found. Redirecting to /login");
        return <Navigate to="/login" replace />;
    }

    // 2. If a specific role is required, enforce it
    const userRole = role ? role.toLowerCase() : "";
    const targetRole = requiredRole ? requiredRole.toLowerCase() : "";

    // Allow 'brandowner' to count as 'brand', and 'user' to count as 'customer'
    const isMatch = userRole === targetRole ||
        (targetRole === "brand" && (userRole === "brand" || userRole === "brandowner")) ||
        (targetRole === "customer" && (userRole === "customer" || userRole === "user"));

    if (targetRole && !isMatch) {
        console.warn(`[ProtectedRoute] Role mismatch! User: ${userRole}, Required: ${targetRole}`);
        // Redirect to the appropriate dashboard based on ACTUAL role
        if (userRole === "admin") {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === "brand" || userRole === "brandowner") {
            return <Navigate to="/brand/dashboard" replace />;
        } else if (userRole === "customer") {
            return <Navigate to="/home" replace />;
        } else {
            // Unknown role or mismatch — force re-login or home
            return <Navigate to="/login" replace />;
        }
    }

    // 3. Authorized — render the page
    return children;
};

export default ProtectedRoute;
