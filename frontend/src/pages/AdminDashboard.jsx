import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  Database,
  Search,
  Eye,
  Zap,
  Flame,
  User,
  X,
  Building2,
  Tag,
  Calendar,
  AlertTriangle,
  FileText,
  RotateCcw,
  Layers,
  Activity
} from 'lucide-react';

import {
  getAdminStats,
  getComplaints,
  seedAdminData,
  updateComplaintStatus,
  simulateSLABreach,
  escalateComplaint
} from '../services/api';

import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import AgentPipelineVisualizer from '../components/AgentPipelineVisualizer';
import ComplaintTimeline from '../components/ComplaintTimeline';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [statsData, complaintsData] = await Promise.all([
        getAdminStats(),
        getComplaints()
      ]);

      setStats(statsData);
      setTickets(complaintsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setFetchError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Unable to load municipal operations data. Please check network connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 4000);
  };

  const handleSeedData = async () => {
    try {
      setActionLoading(true);
      await seedAdminData();
      showToast('Demo municipal complaints successfully seeded.');
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to seed demo data.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setActionLoading(true);
      const updated = await updateComplaintStatus(ticketId, newStatus);
      showToast(`Ticket #${ticketId} status updated to ${newStatus}`);

      if (selectedTicket && selectedTicket.ticketId === ticketId) {
        setSelectedTicket(updated);
      }

      await loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualEscalate = async (ticketId) => {
    try {
      setActionLoading(true);
      const res = await escalateComplaint(
        ticketId,
        'Manual staff escalation from operations dashboard.'
      );
      showToast(`Ticket #${ticketId} escalated successfully.`);

      if (selectedTicket && selectedTicket.ticketId === ticketId) {
        setSelectedTicket(
          res.ticket || res.data || { ...selectedTicket, escalated: true, status: 'ESCALATED' }
        );
      }

      await loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Failed to escalate complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateBreach = async (ticketId) => {
    try {
      setActionLoading(true);
      const res = await simulateSLABreach(ticketId);
      showToast(`SLA breach simulated! Escalation agent triggered for #${ticketId}`);

      if (selectedTicket && selectedTicket.ticketId === ticketId) {
        setSelectedTicket(res.ticket);
      }

      await loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to simulate breach.');
    } finally {
      setActionLoading(false);
    }
  };

  const getSlaStatusDisplay = (t) => {
    if (t.status === 'RESOLVED') {
      return {
        label: 'Resolved (SLA Closed)',
        color: '#176B4D',
        bg: '#EAF5EF',
        border: '#C2E2D3'
      };
    }
    if (!t.dueAt) {
      return {
        label: `${t.slaHours || 24}h Target`,
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE'
      };
    }
    const now = new Date();
    const due = new Date(t.dueAt);
    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0 || t.status === 'ESCALATED' || t.escalated) {
      return {
        label: 'SLA BREACHED',
        color: '#DC2626',
        bg: '#FEE2E2',
        border: '#FCA5A5'
      };
    }

    const hoursLeft = diffMs / (1000 * 60 * 60);
    if (hoursLeft <= 4) {
      return {
        label: `AT RISK (${Math.ceil(hoursLeft)}h left)`,
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FCD34D'
      };
    }

    return {
      label: `Within SLA (${Math.ceil(hoursLeft)}h left)`,
      color: '#176B4D',
      bg: '#EAF5EF',
      border: '#C2E2D3'
    };
  };

  // Extract unique categories dynamically from backend ticket records + defaults
  const categoryOptions = Array.from(
    new Set([
      ...tickets.map((t) => t.category).filter(Boolean),
      'Garbage Collection',
      'Water Supply',
      'Road Damage',
      'Streetlight Issue',
      'Drainage Issue'
    ])
  ).sort();

  // Extract unique departments dynamically from backend ticket records + defaults
  const departmentOptions = Array.from(
    new Set([
      ...tickets.map((t) => t.department).filter(Boolean),
      'Sanitation',
      'Water Supply',
      'Roads & Infrastructure',
      'Street Lighting',
      'Drainage',
      'Public Health',
      'General'
    ])
  ).sort();

  const filteredTickets = tickets.filter((t) => {
    const ticketId = String(t.ticketId || '').toLowerCase();
    const description = String(t.description || '').toLowerCase();
    const citizenName = String(t.citizenName || '').toLowerCase();
    const category = String(t.category || '').toLowerCase();
    const department = String(t.department || '').toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      ticketId.includes(search) ||
      description.includes(search) ||
      citizenName.includes(search) ||
      category.includes(search) ||
      department.includes(search);

    const matchesCategory =
      categoryFilter === 'ALL' || t.category === categoryFilter;

    const matchesDept =
      deptFilter === 'ALL' || t.department === deptFilter;

    const matchesStatus =
      statusFilter === 'ALL' || t.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'ALL' || t.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesDept &&
      matchesStatus &&
      matchesPriority
    );
  });

  const hasActiveFilters =
    Boolean(searchTerm) ||
    categoryFilter !== 'ALL' ||
    deptFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  // Calculate SLA visualization metrics
  const now = new Date();
  const slaSummary = {
    healthy: tickets.filter(
      (t) =>
        t.status !== 'RESOLVED' &&
        !t.escalated &&
        t.status !== 'ESCALATED' &&
        t.dueAt &&
        new Date(t.dueAt) - now > 4 * 60 * 60 * 1000
    ).length,
    atRisk: tickets.filter(
      (t) =>
        t.status !== 'RESOLVED' &&
        !t.escalated &&
        t.status !== 'ESCALATED' &&
        t.dueAt &&
        new Date(t.dueAt) - now <= 4 * 60 * 60 * 1000 &&
        new Date(t.dueAt) > now
    ).length,
    breached: tickets.filter(
      (t) =>
        t.escalated ||
        t.status === 'ESCALATED' ||
        (t.status !== 'RESOLVED' && t.dueAt && new Date(t.dueAt) <= now)
    ).length
  };

  const totalActiveSlaTracked =
    slaSummary.healthy + slaSummary.atRisk + slaSummary.breached;

  const departmentChartData = stats?.departmentCounts
    ? Object.keys(stats.departmentCounts).map((dept) => ({
        name: dept,
        count: stats.departmentCounts[dept]
      }))
    : [];

  const priorityChartData = stats?.priorityCounts
    ? Object.keys(stats.priorityCounts).map((p) => ({
        name: p,
        value: stats.priorityCounts[p]
      }))
    : [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#17201C',
            border: '1px solid #176B4D',
            color: '#FFFFFF',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            fontWeight: '600',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <Zap size={18} color="#176B4D" />
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '1.25rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #E3E7E4'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.85rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#17201C'
              }}
            >
              Municipal Operations
            </h1>

            {user && (
              <span
                style={{
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  color: '#176B4D',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <User size={12} color="#176B4D" /> {user.role}
              </span>
            )}
          </div>

          <p style={{ color: '#66716B', fontSize: '0.9rem', margin: 0 }}>
            Monitor civic complaints, department activity and SLA performance.
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            onClick={loadDashboardData}
            className="btn-secondary"
            disabled={loading}
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin-slow' : ''} />
            Refresh Data
          </button>

          <button
            onClick={handleSeedData}
            className="btn-secondary"
            disabled={actionLoading}
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            title="Seed demo municipal complaints"
          >
            <Database size={15} color="#176B4D" />
            Seed Demo Data
          </button>
        </div>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          style={{
            background: '#FDF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            borderRadius: '10px',
            padding: '0.9rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}
        >
          <ShieldAlert size={20} color="#DC2626" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Operational Priority Banner */}
      {((stats?.escalated || 0) > 0 || (stats?.slaBreached || 0) > 0) && (
        <div
          style={{
            background: '#FDF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            padding: '0.9rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '700', color: '#B91C1C', fontSize: '0.88rem' }}>
                Operational Notice: Action Required
              </div>
              <div style={{ fontSize: '0.82rem', color: '#7F1D1D', marginTop: '2px' }}>
                {stats?.escalated || 0} complaint(s) escalated and {stats?.slaBreached || 0} overdue. Review high-priority items below.
              </div>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('ESCALATED')}
            className="btn-secondary"
            style={{
              fontSize: '0.78rem',
              padding: '0.4rem 0.8rem',
              borderColor: '#FCA5A5',
              color: '#B91C1C',
              background: '#FFFFFF'
            }}
          >
            Filter Escalated
          </button>
        </div>
      )}

      {/* Operational Summary Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <StatsCard
          title="Total Complaints"
          value={stats?.total || 0}
          icon={<FileText size={18} color="#176B4D" />}
          color="#176B4D"
          subtitle="All logged grievances"
        />

        <StatsCard
          title="Open"
          value={stats?.open || 0}
          icon={<Clock size={18} color="#2563EB" />}
          color="#2563EB"
          subtitle="Awaiting resolution"
        />

        <StatsCard
          title="In Progress"
          value={stats?.inProgress || 0}
          icon={<RefreshCw size={18} color="#D97706" />}
          color="#D97706"
          subtitle="Field team assigned"
        />

        <StatsCard
          title="Resolved"
          value={stats?.resolved || 0}
          icon={<CheckCircle2 size={18} color="#176B4D" />}
          color="#176B4D"
          subtitle="Closed successfully"
        />

        <StatsCard
          title="Escalated"
          value={stats?.escalated || 0}
          icon={<ShieldAlert size={18} color="#DC2626" />}
          color="#DC2626"
          subtitle="Officer notice active"
          highlight={(stats?.escalated || 0) > 0}
        />

        <StatsCard
          title="SLA Breached"
          value={stats?.slaBreached || 0}
          icon={<Flame size={18} color="#DC2626" />}
          color="#DC2626"
          subtitle="Target deadline missed"
          highlight={(stats?.slaBreached || 0) > 0}
        />
      </div>

      {/* SLA Health Section V2 */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E3E7E4',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: '700',
                color: '#17201C',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Activity size={16} color="#176B4D" /> SLA Health Overview
            </span>
            <span style={{ fontSize: '0.8rem', color: '#66716B', marginLeft: '0.5rem' }}>
              Current complaint SLA health and deadline compliance
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', fontWeight: '600' }}>
            <span style={{ color: '#176B4D', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#176B4D' }} />
              Within SLA ({slaSummary.healthy})
            </span>
            <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }} />
              At Risk ({slaSummary.atRisk})
            </span>
            <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
              Breached ({slaSummary.breached})
            </span>
          </div>
        </div>

        {/* Distribution Progress Bar */}
        <div
          style={{
            height: '8px',
            width: '100%',
            background: '#F0F3F1',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          {totalActiveSlaTracked > 0 ? (
            <>
              <div
                style={{
                  width: `${(slaSummary.healthy / (stats?.total || 1)) * 100}%`,
                  background: '#176B4D',
                  transition: 'width 0.3s ease'
                }}
                title={`Within SLA: ${slaSummary.healthy}`}
              />
              <div
                style={{
                  width: `${(slaSummary.atRisk / (stats?.total || 1)) * 100}%`,
                  background: '#D97706',
                  transition: 'width 0.3s ease'
                }}
                title={`At Risk: ${slaSummary.atRisk}`}
              />
              <div
                style={{
                  width: `${(slaSummary.breached / (stats?.total || 1)) * 100}%`,
                  background: '#DC2626',
                  transition: 'width 0.3s ease'
                }}
                title={`Breached: ${slaSummary.breached}`}
              />
            </>
          ) : (
            <div style={{ width: '100%', background: '#E3E7E4' }} />
          )}
        </div>
      </div>

      {/* Analytics Section Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Department Workload Bar Chart */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E3E7E4',
            borderRadius: '12px',
            padding: '1.25rem'
          }}
        >
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              color: '#17201C',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Building2 size={16} color="#176B4D" /> Department Workload
          </h3>

          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#66716B"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#66716B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E3E7E4',
                    borderRadius: '8px',
                    color: '#17201C',
                    fontSize: '0.82rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#176B4D"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E3E7E4',
            borderRadius: '12px',
            padding: '1.25rem'
          }}
        >
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              color: '#17201C',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Layers size={16} color="#176B4D" /> Priority Breakdown
          </h3>

          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="35%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#DC2626', '#D97706', '#2563EB', '#176B4D'][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E3E7E4',
                    borderRadius: '8px',
                    color: '#17201C',
                    fontSize: '0.82rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  formatter={(value) => {
                    const item = priorityChartData.find((e) => e.name === value);
                    return `${value} (${item?.value || 0})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* COMPLAINT OPERATIONS — HERO SECTION */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E3E7E4',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}
      >
        {/* Operations Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: '800',
                color: '#17201C',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              Complaint Operations
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#66716B', margin: '2px 0 0' }}>
              Review, filter and manage active municipal complaints.
            </p>
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#66716B',
              background: '#F7F8F6',
              border: '1px solid #E3E7E4',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#176B4D' }} />
            Showing <strong style={{ color: '#17201C' }}>{filteredTickets.length}</strong> of{' '}
            <strong style={{ color: '#17201C' }}>{tickets.length}</strong> complaints
          </div>
        </div>

        {/* Filter Toolbar V2 */}
        <div
          style={{
            background: '#F7F8F6',
            border: '1px solid #E3E7E4',
            borderRadius: '12px',
            padding: '1rem 1.15rem',
            marginBottom: '1.25rem'
          }}
        >
          {/* CATEGORY QUICK FILTER PILLS */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: '700',
                color: '#66716B',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Filter By Category
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                id="cat-pill-all"
                onClick={() => setCategoryFilter('ALL')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: categoryFilter === 'ALL' ? '1px solid #176B4D' : '1px solid #E3E7E4',
                  background: categoryFilter === 'ALL' ? '#176B4D' : '#FFFFFF',
                  color: categoryFilter === 'ALL' ? '#FFFFFF' : '#17201C',
                  boxShadow: categoryFilter === 'ALL' ? '0 2px 6px rgba(23, 107, 77, 0.18)' : 'none'
                }}
              >
                All Categories
              </button>

              {categoryOptions.map((cat) => {
                const isActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    id={`cat-pill-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isActive ? '1px solid #176B4D' : '1px solid #E3E7E4',
                      background: isActive ? '#176B4D' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#17201C',
                      boxShadow: isActive ? '0 2px 6px rgba(23, 107, 77, 0.18)' : 'none'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.85rem',
              alignItems: 'flex-end',
              borderTop: '1px solid #E3E7E4',
              paddingTop: '0.85rem'
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '2 1 240px', minWidth: '200px' }}>
              <label
                htmlFor="search-complaints-input"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#66716B',
                  marginBottom: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  color="#66716B"
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  id="search-complaints-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ticket ID, category or complaint..."
                  className="form-input"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.85rem 0 2.3rem',
                    fontSize: '0.85rem',
                    fontWeight: '400',
                    color: '#17201C',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E3E7E4',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Category Filter Dropdown */}
            <div style={{ flex: '1 1 170px', minWidth: '150px' }}>
              <label
                htmlFor="category-filter-select"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#66716B',
                  marginBottom: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Category Dropdown
              </label>
              <select
                id="category-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#17201C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E3E7E4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="ALL" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  All Categories
                </option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat} style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter Dropdown */}
            <div style={{ flex: '1 1 170px', minWidth: '150px' }}>
              <label
                htmlFor="dept-filter-select"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#66716B',
                  marginBottom: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Department
              </label>
              <select
                id="dept-filter-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#17201C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E3E7E4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="ALL" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  All Departments
                </option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept} style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
              <label
                htmlFor="status-filter-select"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#66716B',
                  marginBottom: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Status
              </label>
              <select
                id="status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#17201C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E3E7E4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="ALL" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  All Statuses
                </option>
                <option value="OPEN" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  Open
                </option>
                <option value="IN_PROGRESS" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  In Progress
                </option>
                <option value="RESOLVED" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  Resolved
                </option>
                <option value="ESCALATED" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  Escalated
                </option>
              </select>
            </div>

            {/* Priority Filter Dropdown */}
            <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
              <label
                htmlFor="priority-filter-select"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#66716B',
                  marginBottom: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Priority
              </label>
              <select
                id="priority-filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#17201C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E3E7E4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="ALL" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  All Priorities
                </option>
                <option value="CRITICAL" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  Critical
                </option>
                <option value="HIGH" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  High
                </option>
                <option value="MEDIUM" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  Medium
                </option>
                <option value="LOW" style={{ backgroundColor: '#FFFFFF', color: '#17201C' }}>
                  Low
                </option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div style={{ flex: '0 0 auto', minWidth: '130px' }}>
                <button
                  id="clear-filters-button"
                  onClick={clearAllFilters}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    height: '40px',
                    padding: '0 0.85rem',
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E3E7E4',
                    borderRadius: '8px',
                    color: '#17201C',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Indicators Bar */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
              fontSize: '0.78rem'
            }}
          >
            <span style={{ fontWeight: '700', color: '#66716B' }}>Active Filters:</span>

            {searchTerm && (
              <span
                style={{
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  color: '#176B4D',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Search: "{searchTerm}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              </span>
            )}

            {categoryFilter !== 'ALL' && (
              <span
                style={{
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  color: '#176B4D',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Category: {categoryFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCategoryFilter('ALL')} />
              </span>
            )}

            {deptFilter !== 'ALL' && (
              <span
                style={{
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  color: '#176B4D',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Department: {deptFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setDeptFilter('ALL')} />
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span
                style={{
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  color: '#176B4D',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Status: {statusFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')} />
              </span>
            )}

            {priorityFilter !== 'ALL' && (
              <span
                style={{
                  background: '#EAF5EF',
                  border: '1px solid #C2E2D3',
                  color: '#176B4D',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Priority: {priorityFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPriorityFilter('ALL')} />
              </span>
            )}
          </div>
        )}

        {/* Complaints Data Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #E3E7E4', borderRadius: '10px', background: '#FFFFFF' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}
          >
            <thead>
              <tr style={{ background: '#F7F8F6', borderBottom: '1px solid #E3E7E4', color: '#66716B' }}>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  TICKET
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  COMPLAINT
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  CATEGORY
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  DEPARTMENT
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  PRIORITY
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  SLA
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  CREATED
                </th>
                <th
                  style={{
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    textAlign: 'right'
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#66716B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <RefreshCw size={22} className="animate-spin-slow" color="#176B4D" />
                      <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#17201C' }}>
                        Loading municipal complaints...
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#66716B' }}>
                        Fetching live ticket records from operations database
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: '#66716B'
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#F7F8F6',
                          border: '1px solid #E3E7E4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Search size={22} color="#8E9993" />
                      </div>
                      <div style={{ fontWeight: '700', color: '#17201C', fontSize: '1rem' }}>
                        No complaints found
                      </div>
                      <div style={{ fontSize: '0.83rem', maxWidth: '380px', color: '#66716B', lineHeight: '1.4' }}>
                        No municipal tickets matched your active filter options or search query. Try adjusting your filters.
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="btn-secondary"
                          style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.45rem 1rem', height: '36px' }}
                        >
                          <RotateCcw size={14} /> Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const slaState = getSlaStatusDisplay(t);

                  return (
                    <tr
                      key={t._id || t.ticketId}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        borderBottom: '1px solid #E3E7E4',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F7F8F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Ticket ID */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            color: '#176B4D',
                            background: '#EAF5EF',
                            border: '1px solid #C2E2D3',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-block',
                            letterSpacing: '0.02em'
                          }}
                        >
                          {t.ticketId}
                        </span>
                      </td>

                      {/* Complaint snippet */}
                      <td
                        style={{
                          padding: '0.9rem 1rem',
                          color: '#17201C',
                          fontWeight: '600',
                          maxWidth: '240px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                        title={t.description}
                      >
                        {t.description}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.9rem 1rem', color: '#66716B', fontWeight: '500', verticalAlign: 'middle' }}>
                        {t.category}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.9rem 1rem', color: '#17201C', fontWeight: '500', verticalAlign: 'middle' }}>
                        {t.department}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                        <span className={`badge badge-${t.priority?.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                        {t.escalated || t.status === 'ESCALATED' ? (
                          <span
                            className="badge badge-escalated"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ShieldAlert size={12} /> ESCALATED L{t.escalationLevel || 1}
                          </span>
                        ) : (
                          <span
                            className={`badge ${
                              t.status === 'RESOLVED'
                                ? 'badge-resolved'
                                : t.status === 'IN_PROGRESS'
                                ? 'badge-in-progress'
                                : 'badge-open'
                            }`}
                          >
                            {t.status === 'IN_PROGRESS' ? 'IN PROGRESS' : t.status}
                          </span>
                        )}
                      </td>

                      {/* SLA Deadline */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: slaState.color,
                            background: slaState.bg,
                            border: `1px solid ${slaState.border}`,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Clock size={12} color={slaState.color} />
                          {slaState.label}
                        </span>
                      </td>

                      {/* Created */}
                      <td style={{ padding: '0.9rem 1rem', color: '#66716B', fontSize: '0.8rem', verticalAlign: 'middle' }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <button
                          id={`view-details-${t.ticketId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            height: '34px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E3E7E4',
                            color: '#17201C',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={14} color="#176B4D" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLAINT DETAILS MODAL */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(23, 32, 28, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E3E7E4',
              borderRadius: '16px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem 2rem',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Close Modal Button */}
            <button
              id="close-ticket-modal-button"
              onClick={() => setSelectedTicket(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#F7F8F6',
                border: '1px solid #E3E7E4',
                color: '#17201C',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={18} />
            </button>

            {/* MODAL HEADER */}
            <div
              style={{
                borderBottom: '1px solid #E3E7E4',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: '#66716B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem'
                }}
              >
                Municipal Case File
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    fontSize: '1.4rem',
                    color: '#176B4D',
                    background: '#EAF5EF',
                    border: '1px solid #C2E2D3',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    letterSpacing: '0.02em'
                  }}
                >
                  {selectedTicket.ticketId}
                </span>

                <span className={`badge badge-${selectedTicket.priority?.toLowerCase()}`}>
                  {selectedTicket.priority} PRIORITY
                </span>

                {selectedTicket.escalated || selectedTicket.status === 'ESCALATED' ? (
                  <span
                    className="badge badge-escalated"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ShieldAlert size={12} /> ESCALATED L{selectedTicket.escalationLevel || 1}
                  </span>
                ) : (
                  <span
                    className={`badge ${
                      selectedTicket.status === 'RESOLVED'
                        ? 'badge-resolved'
                        : selectedTicket.status === 'IN_PROGRESS'
                        ? 'badge-in-progress'
                        : 'badge-open'
                    }`}
                  >
                    {selectedTicket.status === 'IN_PROGRESS' ? 'IN PROGRESS' : selectedTicket.status}
                  </span>
                )}
              </div>
            </div>

            {/* CASE OVERVIEW GRID */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.85rem',
                marginBottom: '1.5rem'
              }}
            >
              {/* Category */}
              <div
                style={{
                  background: '#F7F8F6',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E3E7E4'
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#66716B',
                    fontWeight: '700',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  CATEGORY
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: '#17201C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '3px'
                  }}
                >
                  <Tag size={13} color="#176B4D" /> {selectedTicket.category}
                </span>
              </div>

              {/* Department */}
              <div
                style={{
                  background: '#F7F8F6',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E3E7E4'
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#66716B',
                    fontWeight: '700',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  DEPARTMENT
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: '#176B4D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '3px'
                  }}
                >
                  <Building2 size={13} color="#176B4D" /> {selectedTicket.department}
                </span>
              </div>

              {/* SLA Target */}
              <div
                style={{
                  background: '#F7F8F6',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E3E7E4'
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#66716B',
                    fontWeight: '700',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  SLA TARGET
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: '#17201C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '3px'
                  }}
                >
                  <Clock size={13} color="#176B4D" /> {selectedTicket.slaHours || 24} Hours
                </span>
              </div>

              {/* SLA Health */}
              <div
                style={{
                  background: '#F7F8F6',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E3E7E4'
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#66716B',
                    fontWeight: '700',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  SLA HEALTH
                </span>
                {(() => {
                  const slaState = getSlaStatusDisplay(selectedTicket);
                  return (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: slaState.color,
                        display: 'inline-block',
                        marginTop: '4px',
                        background: slaState.bg,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        border: `1px solid ${slaState.border}`
                      }}
                    >
                      {slaState.label}
                    </span>
                  );
                })()}
              </div>

              {/* Submission Date */}
              <div
                style={{
                  background: '#F7F8F6',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E3E7E4'
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#66716B',
                    fontWeight: '700',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  SUBMISSION DATE
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    color: '#17201C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '3px'
                  }}
                >
                  <Calendar size={13} color="#176B4D" />{' '}
                  {selectedTicket.createdAt
                    ? new Date(selectedTicket.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* TWO-COLUMN CONTENT GRID */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              {/* LEFT COLUMN: CITIZEN STATEMENT & CONTACT INFO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Citizen Statement Card */}
                <div
                  style={{
                    background: '#F7F8F6',
                    border: '1px solid #E3E7E4',
                    borderRadius: '12px',
                    padding: '1.15rem 1.25rem'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: '#176B4D',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <FileText size={15} /> Citizen Statement
                  </h3>
                  <p
                    style={{
                      color: '#17201C',
                      fontSize: '0.92rem',
                      lineHeight: '1.6',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontWeight: '500'
                    }}
                  >
                    "{selectedTicket.description}"
                  </p>
                </div>

                {/* Citizen Contact Card */}
                <div
                  style={{
                    background: '#F7F8F6',
                    border: '1px solid #E3E7E4',
                    borderRadius: '12px',
                    padding: '1.15rem 1.25rem'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: '#176B4D',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <User size={15} /> Citizen & Contact Information
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.85rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#66716B',
                          fontWeight: '700',
                          display: 'block',
                          textTransform: 'uppercase'
                        }}
                      >
                        NAME
                      </span>
                      <span
                        style={{
                          color: '#17201C',
                          fontWeight: '700',
                          marginTop: '2px',
                          display: 'block'
                        }}
                      >
                        {selectedTicket.citizenName || 'Anonymous Citizen'}
                      </span>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#66716B',
                          fontWeight: '700',
                          display: 'block',
                          textTransform: 'uppercase'
                        }}
                      >
                        LOCATION
                      </span>
                      <span
                        style={{
                          color: '#17201C',
                          fontWeight: '600',
                          marginTop: '2px',
                          display: 'block'
                        }}
                      >
                        {selectedTicket.location || 'Municipal Ward'}
                      </span>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#66716B',
                          fontWeight: '700',
                          display: 'block',
                          textTransform: 'uppercase'
                        }}
                      >
                        PHONE
                      </span>
                      <span
                        style={{
                          color: '#17201C',
                          fontWeight: '600',
                          marginTop: '2px',
                          display: 'block'
                        }}
                      >
                        {selectedTicket.citizenPhone || (
                          <span style={{ color: '#8E9993' }}>Not provided</span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#66716B',
                          fontWeight: '700',
                          display: 'block',
                          textTransform: 'uppercase'
                        }}
                      >
                        EMAIL
                      </span>
                      <span
                        style={{
                          color: '#17201C',
                          fontWeight: '600',
                          marginTop: '2px',
                          display: 'block'
                        }}
                      >
                        {selectedTicket.citizenEmail || (
                          <span style={{ color: '#8E9993' }}>Not provided</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: WORKFLOW ACTIONS, ESCALATION & DEMO SIMULATION */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Workflow Actions */}
                <div
                  style={{
                    background: '#F7F8F6',
                    border: '1px solid #E3E7E4',
                    borderRadius: '12px',
                    padding: '1.15rem 1.25rem'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: '#176B4D',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Layers size={15} /> Case Management & Status
                  </h3>

                  <div style={{ marginBottom: '1rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#66716B',
                        fontWeight: '600',
                        display: 'block'
                      }}
                    >
                      Current Status
                    </span>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: '800',
                        color: '#17201C',
                        marginTop: '2px'
                      }}
                    >
                      {selectedTicket.status === 'IN_PROGRESS'
                        ? 'IN PROGRESS'
                        : selectedTicket.status}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {selectedTicket.status === 'OPEN' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.ticketId, 'IN_PROGRESS')}
                        className="btn-secondary"
                        style={{ fontSize: '0.83rem', padding: '0.55rem 1rem', flex: '1 1 auto' }}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Updating...' : 'Mark In Progress'}
                      </button>
                    )}

                    {selectedTicket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.ticketId, 'RESOLVED')}
                        className="btn-primary"
                        style={{ fontSize: '0.83rem', padding: '0.55rem 1rem', flex: '1 1 auto' }}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Updating...' : 'Mark Resolved ✓'}
                      </button>
                    )}

                    {selectedTicket.status === 'RESOLVED' && (
                      <span
                        style={{
                          color: '#176B4D',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          background: '#EAF5EF',
                          padding: '0.5rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #C2E2D3',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        <CheckCircle2 size={16} /> Issue Closed & Resolved
                      </span>
                    )}

                    {!selectedTicket.escalated && selectedTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleManualEscalate(selectedTicket.ticketId)}
                        className="btn-secondary"
                        style={{
                          fontSize: '0.83rem',
                          padding: '0.55rem 1rem',
                          borderColor: '#FCA5A5',
                          color: '#DC2626',
                          flex: '1 1 auto'
                        }}
                        disabled={actionLoading}
                      >
                        <ShieldAlert size={15} color="#DC2626" />
                        {actionLoading ? 'Escalating...' : 'Escalate Complaint'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Escalation Information (Only if escalated) */}
                {(selectedTicket.escalated || selectedTicket.status === 'ESCALATED') && (
                  <div
                    style={{
                      background: '#FDF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '12px',
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        color: '#B91C1C',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <AlertTriangle size={16} color="#DC2626" /> Escalation Active
                    </h3>

                    <div style={{ fontSize: '0.83rem', color: '#7F1D1D', lineHeight: '1.5' }}>
                      <div>
                        <strong>Escalation Level:</strong> Level {selectedTicket.escalationLevel || 1}
                      </div>
                      {selectedTicket.escalationReason && (
                        <div style={{ marginTop: '3px' }}>
                          <strong>Reason:</strong> {selectedTicket.escalationReason}
                        </div>
                      )}
                      {selectedTicket.escalatedAt && (
                        <div style={{ marginTop: '3px' }}>
                          <strong>Escalated At:</strong>{' '}
                          {new Date(selectedTicket.escalatedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SLA Breach Simulation Demo Sub-Card */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E3E7E4',
                    borderRadius: '10px',
                    padding: '0.9rem 1rem'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem'
                    }}
                  >
                    <span
                      style={{
                        color: '#176B4D',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Flame size={14} /> SLA Breach Simulation
                    </span>
                    <span
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Demo / Simulation
                    </span>
                  </div>

                  <p
                    style={{
                      color: '#66716B',
                      fontSize: '0.76rem',
                      margin: '0 0 0.65rem 0',
                      lineHeight: '1.4'
                    }}
                  >
                    Simulate deadline expiration to trigger automated escalation agent logic for hackathon demonstration.
                  </p>

                  <button
                    onClick={() => handleSimulateBreach(selectedTicket.ticketId)}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.4rem 0.8rem',
                      borderColor: '#FCA5A5',
                      color: '#DC2626',
                      width: '100%'
                    }}
                    disabled={actionLoading}
                  >
                    <ShieldAlert size={14} />
                    {actionLoading ? 'Simulating...' : 'Simulate SLA Breach'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI MULTI-AGENT TELEMETRY */}
            <div style={{ marginBottom: '1.5rem' }}>
              <AgentPipelineVisualizer complaint={selectedTicket} />
            </div>

            {/* PROGRESS TIMELINE */}
            <div>
              <ComplaintTimeline complaint={selectedTicket} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}