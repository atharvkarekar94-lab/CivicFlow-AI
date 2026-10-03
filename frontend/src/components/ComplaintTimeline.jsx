import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, UserCheck } from 'lucide-react';

export default function ComplaintTimeline({ complaint }) {
  if (!complaint) return null;

  const isEscalated = complaint.escalated || complaint.status === 'ESCALATED';
  const isResolved = complaint.status === 'RESOLVED';

  const normalSteps = [
    {
      title: 'Complaint Submitted',
      description: `Logged by ${complaint.citizenName} on ${new Date(complaint.createdAt).toLocaleString()}`,
      status: 'completed',
      date: new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      title: 'AI Multi-Agent Pipeline',
      description: `Classified as ${complaint.category} (${Math.round((complaint.aiConfidence || 0.95) * 100)}% confidence)`,
      status: 'completed'
    },
    {
      title: 'Department Assigned',
      description: `Routed to ${complaint.department} Department under ${complaint.priority} priority (${complaint.slaHours}h SLA)`,
      status: 'completed'
    },
    {
      title: 'Officer Processing',
      description: isResolved ? 'Issue resolved by field team' : (isEscalated ? 'SLA breached - Action escalated' : 'Assigned field team dispatched'),
      status: isResolved ? 'completed' : (isEscalated ? 'escalated' : 'active')
    },
    {
      title: isResolved ? 'Issue Resolved ✓' : 'Resolution Completed',
      description: isResolved ? `Closed on ${new Date(complaint.resolvedAt || complaint.updatedAt || Date.now()).toLocaleString()}` : 'Awaiting final verification',
      status: isResolved ? 'completed' : 'pending'
    }
  ];

  const escalationTiers = [
    { level: 1, title: 'Level 1: Department Officer', description: 'Assigned Zonal Field Supervisor' },
    { level: 2, title: 'Level 2: Senior Municipal Officer', description: 'Escalated to Executive Engineer' },
    { level: 3, title: 'Level 3: Municipal Administrator', description: 'Direct Action by Municipal Commissioner' }
  ];

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ color: '#17201C', fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={18} color="#176B4D" /> Status & SLA Escalation Progress Timeline
      </h4>

      {isEscalated && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <ShieldAlert size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '800', color: '#B91C1C', fontSize: '0.9rem' }}>
                AUTOMATED SLA ESCALATION ACTIVE
              </span>
              <span className="badge badge-escalated">LEVEL {complaint.escalationLevel || 1}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#7F1D1D', marginTop: '3px', margin: 0 }}>
              {complaint.escalationReason || 'Resolution SLA limit exceeded. Escalated to higher municipal authority for priority resolution.'}
            </p>
          </div>
        </div>
      )}

      {/* Visual Vertical Timeline */}
      <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
        {/* Continuous Line */}
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '10px',
          bottom: '20px',
          width: '2px',
          background: isEscalated ? 'linear-gradient(to bottom, #176B4D, #DC2626)' : 'linear-gradient(to bottom, #176B4D, #2563EB)'
        }}></div>

        {normalSteps.map((step, idx) => {
          let nodeColor = '#CBD5E1';
          let textColor = '#66716B';

          if (step.status === 'completed') {
            nodeColor = '#176B4D';
            textColor = '#17201C';
          } else if (step.status === 'active') {
            nodeColor = '#2563EB';
            textColor = '#1D4ED8';
          } else if (step.status === 'escalated') {
            nodeColor = '#DC2626';
            textColor = '#B91C1C';
          }

          return (
            <div key={idx} style={{ position: 'relative', marginBottom: '1.25rem' }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: '-1.75rem',
                top: '2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: nodeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step.status === 'completed' && <CheckCircle2 size={14} color="#fff" />}
                {step.status === 'active' && <Clock size={14} color="#fff" />}
                {step.status === 'escalated' && <AlertTriangle size={14} color="#fff" />}
                {step.status === 'pending' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8E9993' }}></div>}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: textColor }}>{step.title}</span>
                  {step.date && <span style={{ fontSize: '0.75rem', color: '#8E9993' }}>• {step.date}</span>}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#66716B', marginTop: '2px', margin: 0 }}>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Escalation Hierarchy Details */}
      {isEscalated && (
        <div style={{
          background: '#F0F3F1',
          border: '1px solid #E3E7E4',
          borderRadius: '10px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h5 style={{ color: '#DC2626', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.65rem 0' }}>
            <UserCheck size={16} /> Escalation Officer Matrix
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
            {escalationTiers.map((tier) => {
              const isActiveTier = (complaint.escalationLevel || 1) >= tier.level;
              return (
                <div key={tier.level} style={{
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: isActiveTier ? '#FEE2E2' : '#FFFFFF',
                  border: isActiveTier ? '1px solid #FCA5A5' : '1px solid #E3E7E4'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: isActiveTier ? '#B91C1C' : '#66716B' }}>
                    {tier.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isActiveTier ? '#7F1D1D' : '#8E9993', marginTop: '2px' }}>
                    {tier.description}
                  </div>
                  {isActiveTier && (
                    <span style={{ fontSize: '0.65rem', color: '#DC2626', fontWeight: '800', display: 'inline-block', marginTop: '4px' }}>
                      ✓ NOTIFIED & ESCALATED
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
