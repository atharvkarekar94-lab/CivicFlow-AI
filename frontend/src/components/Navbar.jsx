import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, FileText, Search, LayoutDashboard, LogIn, UserPlus, LogOut, User, ListOrdered } from 'lucide-react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const ping = async () => {
      try {
        await checkHealth();
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };
    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E3E7E4',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 2rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Area */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: '#EAF5EF',
            border: '1px solid #C2E2D3',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={20} color="#176B4D" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#17201C' }}>
            CivicFlow <span style={{ color: '#176B4D' }}>AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            textDecoration: 'none',
            color: isActive('/') ? '#176B4D' : '#66716B',
            background: isActive('/') ? '#EAF5EF' : 'transparent',
            border: isActive('/') ? '1px solid #C2E2D3' : '1px solid transparent',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}>
            {user && user.role === 'CITIZEN' ? <LayoutDashboard size={16} /> : <FileText size={16} />}
            {user && user.role === 'CITIZEN' ? 'Dashboard' : 'Report Complaint'}
          </Link>

          <Link to="/track" style={{
            textDecoration: 'none',
            color: isActive('/track') ? '#176B4D' : '#66716B',
            background: isActive('/track') ? '#EAF5EF' : 'transparent',
            border: isActive('/track') ? '1px solid #C2E2D3' : '1px solid transparent',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}>
            <Search size={16} />
            Track
          </Link>

          {user && (user.role === 'CITIZEN' || user.role === 'SUPER_ADMIN') && (
            <Link to="/my-complaints" style={{
              textDecoration: 'none',
              color: isActive('/my-complaints') ? '#176B4D' : '#66716B',
              background: isActive('/my-complaints') ? '#EAF5EF' : 'transparent',
              border: isActive('/my-complaints') ? '1px solid #C2E2D3' : '1px solid transparent',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}>
              <ListOrdered size={16} />
              My Complaints
            </Link>
          )}

          {user && (user.role === 'STAFF' || user.role === 'SUPER_ADMIN') && (
            <Link to="/admin" style={{
              textDecoration: 'none',
              color: isActive('/admin') ? '#176B4D' : '#66716B',
              background: isActive('/admin') ? '#EAF5EF' : 'transparent',
              border: isActive('/admin') ? '1px solid #C2E2D3' : '1px solid transparent',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}>
              <LayoutDashboard size={16} />
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* Status Indicator & User Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* System Status */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: '600', color: '#66716B' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#176B4D' : '#DC2626',
              display: 'inline-block'
            }}></span>
            <span>{isOnline ? 'Agents Online' : 'Offline'}</span>
          </div>

          {/* User Controls */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid #E3E7E4', paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={16} color="#176B4D" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#17201C', lineHeight: '1.2' }}>
                    {user.name || user.email}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#66716B' }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #E3E7E4', paddingLeft: '1rem' }}>
              <Link to="/login" style={{
                textDecoration: 'none',
                color: '#17201C',
                background: '#FFFFFF',
                border: '1px solid #E3E7E4',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}>
                <LogIn size={14} color="#176B4D" /> Log in
              </Link>

              <Link to="/register" style={{
                textDecoration: 'none',
                color: '#FFFFFF',
                background: '#176B4D',
                border: '1px solid #176B4D',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <UserPlus size={14} /> Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
