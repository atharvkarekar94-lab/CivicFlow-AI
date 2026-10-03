import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clock, AlertTriangle, CheckCircle2, FileText, Tag, Building, Calendar, Loader2 } from 'lucide-react';
import { getComplaintByTicketId } from '../services/api';
import ComplaintTimeline from '../components/ComplaintTimeline';
import AgentPipelineVisualizer from '../components/AgentPipelineVisualizer';

export default function TrackComplaint() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicketId = searchParams.get('ticketId') || '';

  const [ticketIdInput, setTicketIdInput] = useState(initialTicketId);
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState(null); // 'NOT_FOUND' | 'SERVER_ERROR' | null

  const fetchTicket = useCallback(async (idToFetch) => {
    if (!idToFetch || !idToFetch.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setErrorType(null);
    setComplaint(null);
    
    try {
      const data = await getComplaintByTicketId(idToFetch.trim());
      if (data && (data.ticketId || data._id)) {
        setComplaint(data);
      } else {
        setErrorType('NOT_FOUND');
        setErrorMsg(`Complaint ticket "${idToFetch.trim()}" was not found in our municipal record system. Please double-check your Ticket ID.`);
      }
    } catch (err) {
      console.error('Error tracking ticket:', err);
      setComplaint(null);
      if (err.response?.status === 404) {
        setErrorType('NOT_FOUND');
        setErrorMsg(`Complaint ticket "${idToFetch.trim()}" was not found in our municipal record system. Please double-check your Ticket ID.`);
      } else {
        setErrorType('SERVER_ERROR');
        setErrorMsg('Unable to connect to the municipal server. Please check your network connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTicketId) {
      setTicketIdInput(initialTicketId);
      fetchTicket(initialTicketId);
    }
  }, [initialTicketId, fetchTicket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!ticketIdInput.trim() || loading) return;
    setSearchParams({ ticketId: ticketIdInput.trim() });
    fetchTicket(ticketIdInput.trim());
  };

  const getTimeRemainingText = (dueAt, status) => {
    if (status === 'RESOLVED') return { text: 'Resolved (SLA Closed)', color: '#238B63' };
    if (!dueAt) return { text: 'SLA Active', color: 'var(--accent-emerald)' };

    const now = new Date();
    const due = new Date(dueAt);
    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { text: 'SLA BREACHED', color: '#C94A4A' };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours <= 4) {
      return { text: `AT RISK (${hours}h ${mins}m left)`, color: '#C8891A' };
    }
    return { text: `HEALTHY (${hours}h ${mins}m left)`, color: '#238B63' };
  };

  const getStatusBadge = (status, isEscalated) => {
    const s = (status || '').toUpperCase();
    if (isEscalated || s === 'ESCALATED') {
      return <span className="badge badge-escalated">ESCALATED</span>;
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
      case 'CRITICAL': return <span className="badge badge-critical">CRITICAL</span>;
      case 'HIGH': return <span className="badge badge-high">HIGH</span>;
      case 'MEDIUM': return <span className="badge badge-medium">MEDIUM</span>;
      default: return <span className="badge badge-low">LOW</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
          Track Complaint Status
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem', margin: 0 }}>
          Enter your CivicFlow Ticket ID to view live resolution progress, department routing, and SLA deadlines.
        </p>
      </div>

      {/* Ticket Lookup Search Form */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="var(--accent-emerald)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              value={ticketIdInput}
              onChange={(e) => setTicketIdInput(e.target.value)}
              placeholder="Enter ticket ID (e.g. CIV-1001)..."
              className="form-input"
              style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}
              disabled={loading}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !ticketIdInput.trim()}
            style={{ padding: '0.65rem 1.35rem', fontSize: '0.88rem', fontWeight: '600' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin-slow" />
                Searching...
              </>
            ) : (
              <>Track Status <Search size={15} /></>
            )}
          </button>
        </form>

        {/* Sample Demo Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Sample Tickets:
          </span>
          {['CIV-1001', 'CIV-1002', 'CIV-1003', 'CIV-1004', 'CIV-1005'].map(id => (
            <button
              key={id}
              type="button"
              disabled={loading}
              onClick={() => { setTicketIdInput(id); setSearchParams({ ticketId: id }); fetchTicket(id); }}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                color: 'var(--accent-emerald)',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              className="btn-secondary"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <Loader2 size={36} color="var(--accent-emerald)" className="animate-spin-slow" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
            Fetching Complaint Details...
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', margin: 0 }}>
            Retrieving live SLA status, department routing, and multi-agent execution telemetry...
          </p>
        </div>
      )}

      {/* Error State */}
      {errorMsg && !loading && (
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: '#FDF2F2', border: '1px solid #F87171' }}>
          <AlertTriangle size={38} color="#C94A4A" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            {errorType === 'NOT_FOUND' ? 'Complaint Ticket Not Found' : 'Unable to Load Complaint'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* Initial Empty State */}
      {!initialTicketId && !complaint && !loading && !errorMsg && (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Search size={44} color="var(--text-secondary)" style={{ marginBottom: '0.85rem', opacity: 0.6 }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.4rem' }}>
            Track Your Municipal Complaint
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto', lineHeight: '1.5' }}>
            Enter your CivicFlow ticket ID above to view real-time status updates, assigned department, severity priority, and resolution timeline.
          </p>
        </div>
      )}

      {/* Complaint Overview & Details */}
      {complaint && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Ticket Card */}
          <div className="card" style={{ padding: '1.75rem', border: complaint.escalated ? '1px solid #F87171' : '1px solid var(--border-color)' }}>
            {/* Ticket Header Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.1rem', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                    {complaint.ticketId}
                  </h2>
                  {getPriorityBadge(complaint.priority)}
                  {getStatusBadge(complaint.status, complaint.escalated)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', margin: 0 }}>
                  Submitted by <strong style={{ color: 'var(--text-main)' }}>{complaint.citizenName}</strong> on {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>

              {/* SLA Target / Remaining Badge */}
              <div style={{
                background: '#F7F8F6',
                padding: '0.75rem 1.1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                textAlign: 'right'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.04em', display: 'block', textTransform: 'uppercase' }}>
                  SLA DEADLINE COUNTDOWN
                </span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: getTimeRemainingText(complaint.dueAt, complaint.status).color }}>
                  {getTimeRemainingText(complaint.dueAt, complaint.status).text}
                </span>
              </div>
            </div>

            {/* Department & Category Metadata grid */}
            <div style={{ marginTop: '1.1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>ISSUE CATEGORY</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                  <Tag size={14} color="var(--accent-emerald)" /> {complaint.category}
                </span>
              </div>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>ASSIGNED DEPARTMENT</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                  <Building size={14} color="var(--accent-emerald)" /> {complaint.department}
                </span>
              </div>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>RESOLUTION TARGET</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: '#238B63', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                  <Clock size={14} color="#238B63" /> {complaint.slaHours || 24} Hours SLA
                </span>
              </div>
              {complaint.dueAt && (
                <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>DUE DATE & TIME</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                    <Calendar size={14} color="var(--accent-emerald)" /> {new Date(complaint.dueAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description Box */}
            <div style={{ marginTop: '1.1rem', background: '#F7F8F6', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Complaint Statement</span>
              <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginTop: '4px', lineHeight: '1.5', margin: '4px 0 0', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                "{complaint.description}"
              </p>
            </div>
          </div>

          {/* Timeline View */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <ComplaintTimeline complaint={complaint} />
          </div>

          {/* AI Telemetry Breakdown */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <AgentPipelineVisualizer complaint={complaint} />
          </div>
        </div>
      )}
    </div>
  );
}
