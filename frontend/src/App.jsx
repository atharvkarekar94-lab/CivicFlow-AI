import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import CitizenHome from './pages/CitizenHome';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import MyComplaints from './pages/MyComplaints';
import { Cpu } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          
          <main style={{ flex: 1, paddingBottom: '3rem' }}>
            <Routes>
              <Route path="/" element={<CitizenHome />} />
              <Route path="/track" element={<TrackComplaint />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/my-complaints" 
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'SUPER_ADMIN']}>
                    <MyComplaints />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'SUPER_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>

          <footer style={{
            background: '#FFFFFF',
            borderTop: '1px solid #E3E7E4',
            padding: '1.25rem 2rem',
            color: '#66716B',
            fontSize: '0.82rem'
          }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={14} color="#176B4D" />
                </div>
                <span style={{ color: '#17201C', fontWeight: '700' }}>
                  CivicFlow <span style={{ color: '#176B4D' }}>AI</span>
                </span>
                <span style={{ color: '#8E9993' }}>—</span>
                <span style={{ color: '#66716B' }}>
                  Next-Gen Municipal Complaint Intelligence & SLA Escalation
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#66716B', fontSize: '0.82rem' }}>
                <span style={{ color: '#176B4D', fontSize: '0.7rem' }}>●</span> React + Express + Multi-Agent AI Architecture
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

