import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Scanner from "./Scanner";
import Dashboard from "./Dashboard";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ProductForm from "./ProductForm"; 
import ProductManagement from "./ProductManagement"; 
import Approvals from "./Approvals";
import UserManagement from "./UserManagement"; 
import ProductView from "./ProductView";
import RequestList from "./RequestList";
import Service from "./Service";
import Benchmark from "./Benchmark";


const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('token');
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Scanner />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/product/:id" element={<ProductView />} />

        {/* Private Routes (Admin Portal) */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/product-management" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
        <Route path="/approvals" element={<PrivateRoute><Approvals /></PrivateRoute>} />
        <Route path="/user-management" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
        <Route path="/request-list" element={<PrivateRoute><RequestList /></PrivateRoute>} />
        <Route path="/service" element={<PrivateRoute><Service /></PrivateRoute>} />
        

        <Route path="/product-form/:id?" element={<PrivateRoute><ProductForm /></PrivateRoute>} /> 
      </Routes>
    </Router>
  );
}

export default App;