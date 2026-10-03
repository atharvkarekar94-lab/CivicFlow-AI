import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Send, Bot, CheckCircle2, Sparkles, AlertCircle, ArrowRight, Clock, 
  Copy, Check, MapPin, PlusCircle, ListOrdered, Search, Activity, 
  FileText, ShieldAlert, Trash2, Droplets, Truck, Zap, HelpCircle, Loader2
} from 'lucide-react';
import { submitComplaint, getMyComplaints } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AgentPipelineVisualizer from '../components/AgentPipelineVisualizer';

const CATEGORIES = [
  { id: 'Sanitation', name: 'Garbage & Sanitation', icon: Trash2, text: 'Uncollected waste, overflowing bins, dirty public areas' },
  { id: 'Water Supply', name: 'Water Supply', icon: Droplets, text: 'No water supply, low pressure, pipeline leaks' },
  { id: 'Roads & Traffic', name: 'Roads & Potholes', icon: Truck, text: 'Potholes, damaged roads, missing signages' },
  { id: 'Electricity', name: 'Streetlights & Power', icon: Zap, text: 'Broken streetlights, hanging wires, power outages' },
  { id: 'General', name: 'Other Civic Issue', icon: HelpCircle, text: 'Public parks, drainage, noise pollution, general complaints' }
];

const QUICK_EXAMPLES = [
  { category: 'Sanitation', text: 'Garbage has not been collected from our street for the last three days.' },
  { category: 'Water Supply', text: 'There is no water supply in our area since yesterday morning.' },
  { category: 'Roads & Traffic', text: 'There is a dangerous deep pothole near the school entrance.' },
  { category: 'Electricity', text: 'The streetlight near building #4 has not been working for a week.' },
  { category: 'General', text: 'The drainage pipeline near the main road is blocked and overflowing.' }
];

export default function CitizenHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect STAFF or SUPER_ADMIN users to /admin
  useEffect(() => {
    if (user && (user.role === 'STAFF' || user.role === 'SUPER_ADMIN')) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    citizenName: user ? user.name : '',
    citizenPhone: '',
    citizenEmail: user ? user.email : '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        citizenName: prev.citizenName || user.name || '',
        citizenEmail: prev.citizenEmail || user.email || ''
      }));
    }
  }, [user]);

  // Citizen Dashboard Complaints State
  const [myComplaints, setMyComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState('');

  const loadUserComplaints = useCallback(async () => {
    if (!user || user.role !== 'CITIZEN') return;
    setComplaintsLoading(true);
    setComplaintsError('');
    try {
      const res = await getMyComplaints();
      if (res && res.success) {
        setMyComplaints(res.data || []);
      } else {
        setMyComplaints([]);
      }
    } catch (err) {
      console.error(err);
      setComplaintsError(err.response?.data?.message || err.message || 'Failed to load your complaints overview.');
    } finally {
      setComplaintsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'CITIZEN') {
      loadUserComplaints();
    }
  }, [user, loadUserComplaints]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [currentAgentStep, setCurrentAgentStep] = useState(0);
  const [agentTelemetry, setAgentTelemetry] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const AGENT_ANIMATION_STEPS = [
    { title: "Understanding Agent", text: "Analyzing complaint description & text structure..." },
    { title: "Classification Agent", text: "Identifying issue category & semantic context..." },
    { title: "Routing Agent", text: "Selecting appropriate municipal department..." },
    { title: "Priority Agent", text: "Calculating urgency & public safety severity..." },
    { title: "SLA Agent", text: "Assigning resolution deadline & SLA policy..." },
    { title: "Generating Ticket", text: "Creating secure ticket ID & saving to system..." }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setErrorMsg('');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
        setLocationError('');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        setLocationError('Unable to detect location. Please check browser permissions or enter details below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleQuickSelect = (exampleItem) => {
    setSelectedCategory(exampleItem.category);
    setFormData({
      ...formData,
      description: exampleItem.text,
      citizenName: formData.citizenName || (user?.name || ''),
      citizenEmail: formData.citizenEmail || (user?.email || '')
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isProcessing) return; // Prevent duplicate submission

    if (!user) {
      setErrorMsg('Please log in to submit a complaint linked to your citizen account.');
      return;
    }

    if (!location) {
      setErrorMsg('Please capture your current location before submitting your complaint.');
      return;
    }

    if (!formData.description.trim() || !formData.citizenName.trim()) {
      setErrorMsg('Please enter your name and describe your civic problem.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setCurrentAgentStep(0);
    setCreatedTicket(null);

    // Simulate multi-agent animation steps sequentially
    for (let i = 0; i < AGENT_ANIMATION_STEPS.length - 1; i++) {
      setCurrentAgentStep(i);
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    try {
      const payload = {
        ...formData,
        location,
        ...(selectedCategory ? { category: selectedCategory } : {})
      };

      const response = await submitComplaint(payload);
      setCurrentAgentStep(5);
      await new Promise(resolve => setTimeout(resolve, 400));

      setCreatedTicket(response.ticket);
      setAgentTelemetry(response.agentTelemetry);
      setIsProcessing(false);

      // Refresh dashboard complaints stats after successful submission
      loadUserComplaints();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setErrorMsg('Authentication session expired. Please log in again to submit.');
      } else {
        setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Unable to submit complaint. Please check your network connection and try again.');
      }
      setIsProcessing(false);
    }
  };

  const handleCopyTicket = () => {
    if (createdTicket?.ticketId) {
      navigator.clipboard.writeText(createdTicket.ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToReportForm = () => {
    const element = document.getElementById('report-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Badge Helpers for Recent Complaints
  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="badge badge-resolved"><CheckCircle2 size={12} /> RESOLVED</span>;
      case 'ESCALATED':
        return <span className="badge badge-escalated"><ShieldAlert size={12} /> ESCALATED</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-in_progress"><Clock size={12} /> IN PROGRESS</span>;
      default:
        return <span className="badge badge-open"><FileText size={12} /> OPEN</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
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

  // Complaint Statistics calculation
  const totalCount = myComplaints.length;
  const openCount = myComplaints.filter(c => {
    const s = (c.status || '').toUpperCase();
    return s === 'OPEN' || s === 'ESCALATED';
  }).length;
  const inProgressCount = myComplaints.filter(c => (c.status || '').toUpperCase() === 'IN_PROGRESS').length;
  const resolvedCount = myComplaints.filter(c => (c.status || '').toUpperCase() === 'RESOLVED').length;

  const recentComplaints = [...myComplaints]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* ----------------- CITIZEN DASHBOARD HEADER ----------------- */}
      {user && user.role === 'CITIZEN' ? (
        <div style={{ marginBottom: '2.5rem' }}>
          {/* Welcome Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome back, <span style={{ color: 'var(--accent-emerald)' }}>{user.name || user.email}</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.3rem', margin: 0 }}>
                Track your civic complaints and report issues in your municipal area.
              </p>
            </div>
            <button 
              onClick={scrollToReportForm}
              className="btn-primary" 
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            >
              <PlusCircle size={16} /> Report a Problem
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div 
              onClick={scrollToReportForm} 
              className="card" 
              style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.15s ease' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                <PlusCircle size={22} />
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.98rem' }}>Report a Problem</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>File a new municipal complaint</div>
              </div>
            </div>

            <Link 
              to="/my-complaints" 
              className="card" 
              style={{ textDecoration: 'none', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.15s ease' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F7F8F6', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                <ListOrdered size={22} />
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.98rem' }}>My Complaints</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>View submitted complaints ({totalCount})</div>
              </div>
            </Link>

            <Link 
              to="/track" 
              className="card" 
              style={{ textDecoration: 'none', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.15s ease' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F7F8F6', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                <Search size={22} />
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.98rem' }}>Track a Complaint</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Check status by Ticket ID</div>
              </div>
            </Link>
          </div>

          {/* Complaint Overview Statistics */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-emerald)" /> Complaint Overview
            </h2>

            {complaintsLoading ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading overview metrics...
              </div>
            ) : complaintsError ? (
              <div className="card" style={{ padding: '1.25rem', border: '1px solid #F87171', background: '#FDF2F2', color: '#C94A4A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={20} />
                  <span>{complaintsError}</span>
                </div>
                <button onClick={loadUserComplaints} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Retry
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.1rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Complaints</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.2rem' }}>{totalCount}</div>
                </div>

                <div className="card" style={{ padding: '1.1rem', borderLeft: '4px solid #3B82F6' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase' }}>Open</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1D4ED8', marginTop: '0.2rem' }}>{openCount}</div>
                </div>

                <div className="card" style={{ padding: '1.1rem', borderLeft: '4px solid #C8891A' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#C8891A', textTransform: 'uppercase' }}>In Progress</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#B45309', marginTop: '0.2rem' }}>{inProgressCount}</div>
                </div>

                <div className="card" style={{ padding: '1.1rem', borderLeft: '4px solid #238B63' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#238B63', textTransform: 'uppercase' }}>Resolved</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#238B63', marginTop: '0.2rem' }}>{resolvedCount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Complaints Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Clock size={18} color="var(--accent-emerald)" /> Recent Complaints
              </h2>
              {myComplaints.length > 0 && (
                <Link to="/my-complaints" style={{ color: 'var(--accent-emerald)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  View All <ArrowRight size={15} />
                </Link>
              )}
            </div>

            {complaintsLoading ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading recent complaints...
              </div>
            ) : myComplaints.length === 0 ? (
              /* Empty State */
              <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <FileText size={42} color="var(--text-secondary)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                  No complaints yet
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: '1.5' }}>
                  Report a civic issue and we'll route it directly to the responsible municipal department.
                </p>
                <button
                  onClick={scrollToReportForm}
                  className="btn-primary"
                  style={{ fontSize: '0.88rem' }}
                >
                  <PlusCircle size={16} /> Report a Problem
                </button>
              </div>
            ) : (
              /* Grid of Recent Complaints */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {recentComplaints.map((c) => (
                  <div key={c._id || c.ticketId} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-emerald)', fontSize: '0.88rem' }}>
                          {c.ticketId}
                        </span>
                        {getStatusBadge(c.status)}
                      </div>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.45', marginBottom: '0.75rem', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{c.description}"
                      </p>
                    </div>
                    
                    <div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div>
                          <span>Category: </span>
                          <strong style={{ color: 'var(--text-main)' }}>{c.category}</strong>
                        </div>
                        <div>
                          {getPriorityBadge(c.priority)}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <Link to={`/track?ticketId=${c.ticketId}`} style={{ color: 'var(--accent-emerald)', textDecoration: 'none', fontWeight: '600' }}>
                          Track Complaint →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ----------------- GUEST UNAUTHENTICATED HERO HEADER ----------------- */
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--accent-bg)',
            border: '1px solid rgba(22, 116, 90, 0.2)',
            padding: '0.35rem 0.9rem',
            borderRadius: '30px',
            color: 'var(--accent-emerald)',
            fontSize: '0.82rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            <Sparkles size={15} /> Autonomous Municipal Routing Platform
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: '1.25' }}>
            Report Civic Issues Easily. <br />
            <span style={{ color: 'var(--accent-emerald)' }}>
              Multi-Agent AI Routes & Resolves.
            </span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '640px', margin: '0.8rem auto 0', lineHeight: '1.6' }}>
            Submit municipal grievances directly to responsible local authorities with automated SLA deadlines and transparent tracking.
          </p>
        </div>
      )}

      {/* ----------------- REPORT A PROBLEM FORM SECTION ----------------- */}
      <div id="report-form" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Form Container */}
        {!createdTicket && (
          <div className="card" style={{ padding: '2rem' }}>
            
            {/* Header Section */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, letterSpacing: '-0.02em' }}>
                <Bot size={26} color="var(--accent-emerald)" /> Report a Civic Problem
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem', margin: 0, lineHeight: '1.5' }}>
                Select a category, describe the issue, and provide your location. CivicFlow AI automatically classifies, routes, and sets resolution SLA deadlines.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div style={{ 
                background: '#FDF2F2', 
                border: '1px solid #F87171', 
                color: '#C94A4A', 
                padding: '0.85rem 1rem', 
                borderRadius: '8px', 
                marginBottom: '1.25rem', 
                fontSize: '0.9rem', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.6rem',
                lineHeight: '1.4'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Action Required</strong>
                  {errorMsg}
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY SELECTION TILES */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
                Select Complaint Category <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>(Optional)</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      disabled={isProcessing}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--accent-bg)' : '#FFFFFF',
                        color: isSelected ? 'var(--accent-emerald)' : 'var(--text-main)',
                        textAlign: 'left',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        outline: 'none'
                      }}
                      className="category-tile"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <IconComponent size={20} color={isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)'} />
                        {isSelected && <Check size={16} color="var(--accent-emerald)" />}
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>{cat.name}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{cat.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Contact Information Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="citizenName"
                    value={formData.citizenName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className="form-input"
                    disabled={isProcessing}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="citizenPhone"
                    value={formData.citizenPhone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className="form-input"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="citizenEmail"
                    value={formData.citizenEmail}
                    onChange={handleInputChange}
                    placeholder="citizen@example.com"
                    className="form-input"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Problem Description Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Describe the Problem in Detail *
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {formData.description.length} characters
                  </span>
                </div>

                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide details about the issue (e.g., Garbage has not been collected from Main Market street for 3 days. It is blocking the walkway)..."
                  className="form-input"
                  style={{ 
                    resize: 'vertical', 
                    fontSize: '0.92rem', 
                    lineHeight: '1.5',
                    minHeight: '110px'
                  }}
                  disabled={isProcessing}
                  required
                />
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  💡 <strong>Tip:</strong> Mention specific landmarks, duration (e.g., "for 3 days"), and severity to help AI agents route and prioritize quickly.
                </span>
              </div>

              {/* Location Capture Section */}
              <div style={{ marginBottom: '1.5rem', background: '#F7F8F6', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={16} color="var(--accent-emerald)" /> Location Capture *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Required for GPS spatial routing
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isProcessing || isLocating}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: location ? '1px solid rgba(22, 116, 90, 0.3)' : '1px solid var(--border-color)',
                    background: location ? 'var(--accent-bg)' : '#FFFFFF',
                    color: location ? 'var(--accent-emerald)' : 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: (isProcessing || isLocating) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isLocating ? (
                    <>
                      <Loader2 size={16} className="animate-spin-slow" /> Detecting GPS Location...
                    </>
                  ) : location ? (
                    <>
                      <CheckCircle2 size={16} color="var(--accent-emerald)" /> Location Captured ✓ ({location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°)
                    </>
                  ) : (
                    <>
                      <MapPin size={16} /> Click to Capture Current Location
                    </>
                  )}
                </button>

                {locationError && (
                  <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#C94A4A', textAlign: 'center', fontWeight: '600' }}>
                    {locationError}
                  </div>
                )}
              </div>

              {/* Quick Sample Presets */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  ⚡ Quick Sample Issues (Click to test):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {QUICK_EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickSelect(ex)}
                      disabled={isProcessing}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left'
                      }}
                      className="btn-secondary"
                    >
                      "{ex.text.substring(0, 36)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={isProcessing}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '0.85rem 1.25rem', 
                  fontSize: '0.98rem',
                  fontWeight: '700',
                  opacity: isProcessing ? 0.75 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin-slow" />
                    Processing Complaint...
                  </>
                ) : (
                  <>Submit Complaint <Send size={16} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Live Processing Animation Box */}
        {isProcessing && (
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--accent-bg)',
                border: '1px solid rgba(22, 116, 90, 0.2)',
                margin: '0 auto 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={28} color="var(--accent-emerald)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Executing Multi-Agent Workflow
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Analyzing text, classifying issue, routing department & setting resolution SLA...
              </p>
            </div>

            {/* Steps indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
              {AGENT_ANIMATION_STEPS.map((step, idx) => {
                const isDone = idx < currentAgentStep;
                const isCurrent = idx === currentAgentStep;

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '8px',
                    background: isCurrent ? 'var(--accent-bg)' : (isDone ? '#F7F8F6' : '#FFFFFF'),
                    border: isCurrent ? '1px solid rgba(22, 116, 90, 0.3)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : isCurrent ? (
                      <Loader2 size={16} color="var(--accent-emerald)" className="animate-spin-slow" />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-secondary)', margin: '4px' }}></div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isCurrent ? 'var(--accent-emerald)' : (isDone ? 'var(--text-main)' : 'var(--text-secondary)') }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isCurrent ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                        {step.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ticket Created Success View */}
        {createdTicket && (
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={16} /> COMPLAINT SUCCESSFULLY REGISTERED
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px', margin: 0 }}>
                  Ticket ID: <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{createdTicket.ticketId}</span>
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button onClick={handleCopyTicket} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem' }}>
                  {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy Ticket ID'}
                </button>
                <button onClick={() => navigate(`/track?ticketId=${createdTicket.ticketId}`)} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
                  Track Complaint <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Quick telemetry badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>CATEGORY</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>{createdTicket.category}</span>
              </div>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>DEPARTMENT</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>{createdTicket.department}</span>
              </div>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>PRIORITY</span>
                <span className={`badge badge-${createdTicket.priority?.toLowerCase()}`} style={{ marginTop: '3px' }}>{createdTicket.priority}</span>
              </div>
              <div style={{ background: '#F7F8F6', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>RESOLUTION SLA</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>{createdTicket.slaHours} Hours</span>
              </div>
            </div>

            {/* Agent Telemetry Component */}
            <AgentPipelineVisualizer telemetry={agentTelemetry} complaint={createdTicket} />

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => { setCreatedTicket(null); setAgentTelemetry(null); }}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
