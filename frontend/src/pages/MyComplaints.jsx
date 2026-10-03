import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyComplaints } from '../services/api';
import { 
  FileText, Clock, AlertTriangle, CheckCircle2, ShieldAlert, 
  RefreshCw, PlusCircle, Calendar, Tag, Building, ArrowRight 
} from 'lucide-react';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyComplaints();
      if (res && res.success) {
        setComplaints(res.data || []);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load your complaints list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const getStatusBadge = (status, isEscalated) => {
    const s = (status || '').toUpperCase();
    if (isEscalated || s === 'ESCALATED') {
      return <span className="badge badge-escalated"><ShieldAlert size={12} /> ESCALATED</span>;
    }
    switch (s) {
      case 'RESOLVED':
        return <span className="badge badge-resolved"><CheckCircle2 size={12} /> RESOLVED</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-in_progress"><Clock size={12} /> IN PROGRESS</span>;
      default:
        return <span className="badge badge-open"><FileText size={12} /> OPEN</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return <span className="badge badge-critical">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-high">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">MEDIUM</span>;
      default:
        return <span className="badge badge-low">LOW</span>;
    }
  };

  const truncateDescription = (text, maxLength = 160) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Complaint statistics calculation
  const totalCount = complaints.length;
  const openCount = complaints.filter(c => (c.status || '').toUpperCase() === 'OPEN').length;
  const inProgressCount = complaints.filter(c => (c.status || '').toUpperCase() === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => (c.status || '').toUpperCase() === 'RESOLVED').length;
  const escalatedCount = complaints.filter(c => (c.status || '').toUpperCase() === 'ESCALATED' || c.escalated).length;

  // Newest first sorting
  const sortedComplaints = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, letterSpacing: '-0.02em' }}>
            <FileText color="var(--accent-emerald)" size={28} /> My Complaints
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem', margin: 0 }}>
            View and track the status of all municipal complaints you have reported.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchComplaints}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin-slow' : ''} /> Refresh List
          </button>

          <Link
            to="/"
            className="btn-primary"
            style={{ textDecoration: 'none', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={15} /> Report a Problem
          </Link>
        </div>
      </div>

      {/* Complaint Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>{totalCount}</div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #3B82F6' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>OPEN</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1D4ED8', marginTop: '2px' }}>{openCount}</div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #C8891A' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#C8891A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IN PROGRESS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#B45309', marginTop: '2px' }}>{inProgressCount}</div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #238B63' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#238B63', textTransform: 'uppercase', letterSpacing: '0.04em' }}>RESOLVED</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#238B63', marginTop: '2px' }}>{resolvedCount}</div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #C94A4A' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#C94A4A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ESCALATED</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#991B1B', marginTop: '2px' }}>{escalatedCount}</div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: '1.25rem', opacity: 0.7 }}>
              <div style={{ height: '20px', width: '200px', background: '#F7F8F6', borderRadius: '4px', marginBottom: '0.75rem' }}></div>
              <div style={{ height: '14px', width: '80%', background: '#F7F8F6', borderRadius: '4px', marginBottom: '0.4rem' }}></div>
              <div style={{ height: '14px', width: '50%', background: '#F7F8F6', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: '#FDF2F2', border: '1px solid #F87171' }}>
          <AlertTriangle size={38} color="#C94A4A" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Unable to load your complaints
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
            {error}
          </p>
          <button
            onClick={fetchComplaints}
            className="btn-secondary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
        </div>
      ) : sortedComplaints.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <FileText size={48} color="var(--text-secondary)" style={{ marginBottom: '0.85rem', opacity: 0.6 }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.4rem' }}>
            No complaints submitted yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            You haven't submitted any civic complaints. When you report an issue, it will appear here with live tracking.
          </p>
          <Link
            to="/"
            className="btn-primary"
            style={{
              textDecoration: 'none',
              padding: '0.75rem 1.4rem',
              fontSize: '0.9rem'
            }}
          >
            <PlusCircle size={16} /> Report a Problem
          </Link>
        </div>
      ) : (
        /* Complaint List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedComplaints.map((c) => (
            <div 
              key={c._id || c.ticketId} 
              className="card" 
              style={{ padding: '1.25rem', border: c.escalated ? '1px solid #F87171' : '1px solid var(--border-color)' }}
            >
              {/* Card Top Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.95rem', 
                    fontWeight: '800', 
                    color: 'var(--accent-emerald)', 
                    background: 'var(--accent-bg)', 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(22, 116, 90, 0.2)' 
                  }}>
                    {c.ticketId}
                  </span>
                  {getStatusBadge(c.status, c.escalated)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {getPriorityBadge(c.priority)}
                  
                  <Link
                    to={`/track?ticketId=${c.ticketId}`}
                    className="btn-secondary"
                    style={{ 
                      textDecoration: 'none', 
                      fontSize: '0.82rem', 
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px'
                    }}
                  >
                    Track Complaint <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Description (Truncated gracefully) */}
              <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '0.85rem', fontWeight: '500' }}>
                "{truncateDescription(c.description, 160)}"
              </p>

              {/* Metadata row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={14} color="var(--accent-emerald)" />
                  <span>Category: <strong style={{ color: 'var(--text-main)' }}>{c.category}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} color="var(--accent-emerald)" />
                  <span>Department: <strong style={{ color: 'var(--text-main)' }}>{c.department}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="var(--accent-emerald)" />
                  <span>Filed: <strong style={{ color: 'var(--text-main)' }}>{new Date(c.createdAt).toLocaleDateString()}</strong></span>
                </div>

                {c.dueAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} color="#C8891A" />
                    <span>SLA Target: <strong style={{ color: 'var(--text-main)' }}>{new Date(c.dueAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} ({c.slaHours || 24}h SLA)</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
