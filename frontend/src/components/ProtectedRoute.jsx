import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        color: '#94A3B8'
      }}>
        <Cpu size={36} color="#06B6D4" style={{ animation: 'spin 2s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>Verifying Authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'STAFF' || user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/my-complaints" replace />;
    }
  }

  return children;
}
