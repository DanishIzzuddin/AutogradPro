import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoute({ role: requiredRole, children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" replace />;

  try {
    const { role } = jwtDecode(token);
    if (role !== requiredRole) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  } catch {
    return <Navigate to="/auth" replace />;
  }
}
