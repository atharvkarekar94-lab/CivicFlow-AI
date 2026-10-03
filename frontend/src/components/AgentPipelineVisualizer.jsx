import React from 'react';
import { CheckCircle2, ShieldCheck, Bot, Clock, AlertTriangle, Zap } from 'lucide-react';

export default function AgentPipelineVisualizer({ telemetry, complaint }) {
  // If complaint object exists but telemetry doesn't, derive telemetry details
  const understanding = telemetry?.understanding || { cleanedText: complaint?.description, summary: complaint?.description };
  const classification = telemetry?.classification || { category: complaint?.category, confidence: complaint?.aiConfidence || 0.95, reasoning: complaint?.aiReasoning };
  const routing = telemetry?.routing || { department: complaint?.department, reasoning: `Assigned to ${complaint?.department} department.` };
  const priority = telemetry?.priority || { priority: complaint?.priority, reasoning: `Assigned ${complaint?.priority} priority standard.` };
  const sla = telemetry?.sla || { slaHours: complaint?.slaHours || 24, dueAt: complaint?.dueAt };

  const getPriorityClass = (pri) => {
    switch (pri) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-low';
    }
  };

  const agents = [
    {
      id: 'understanding',
      name: 'UNDERSTANDING AGENT',
      icon: <Bot size={18} color="#176B4D" />,
      color: '#176B4D',
      badge: 'PROCESSED',
      primaryOutput: 'Text Sanitized & Analyzed',
      detail: understanding.summary || understanding.cleanedText
    },
    {
      id: 'classification',
      name: 'CLASSIFICATION AGENT',
      icon: <Zap size={18} color="#2563EB" />,
      color: '#2563EB',
      badge: `${Math.round((classification.confidence || 0.95) * 100)}% CONFIDENCE`,
      primaryOutput: classification.category || complaint?.category,
      detail: classification.reasoning
    },
    {
      id: 'routing',
      name: 'ROUTING AGENT',
      icon: <ShieldCheck size={18} color="#7C3AED" />,
      color: '#7C3AED',
      badge: 'DEPARTMENT MATCH',
      primaryOutput: routing.department || complaint?.department,
      detail: routing.reasoning
    },
    {
      id: 'priority',
      name: 'PRIORITY AGENT',
      icon: <AlertTriangle size={18} color="#D97706" />,
      color: '#D97706',
      badge: priority.priority || complaint?.priority,
      badgeClass: getPriorityClass(priority.priority || complaint?.priority),
      primaryOutput: `${priority.priority || complaint?.priority} SEVERITY`,
      detail: priority.reasoning
    },
    {
      id: 'sla',
      name: 'SLA AGENT',
      icon: <Clock size={18} color="#176B4D" />,
      color: '#176B4D',
      badge: `${sla.slaHours || complaint?.slaHours || 24}H TARGET`,
      primaryOutput: `${sla.slaHours || complaint?.slaHours || 24} Hours Resolution SLA`,
      detail: `Resolution Deadline: ${new Date(sla.dueAt || complaint?.dueAt).toLocaleString()}`
    }
  ];

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h4 style={{ color: '#17201C', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={18} color="#176B4D" /> Multi-Agent Execution Telemetry
        </h4>
        <span style={{ fontSize: '0.75rem', color: '#176B4D', background: '#EAF5EF', padding: '3px 10px', borderRadius: '20px', border: '1px solid #C2E2D3', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} /> Pipeline Complete (5/5)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{
            background: '#FFFFFF',
            border: `1px solid #E3E7E4`,
            borderRadius: '10px',
            padding: '0.85rem',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {agent.icon}
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: agent.color, letterSpacing: '0.04em' }}>
                  {agent.name}
                </span>
              </div>
              <CheckCircle2 size={15} color="#176B4D" />
            </div>

            <div style={{ marginBottom: '0.4rem' }}>
              {agent.badgeClass ? (
                <span className={`badge ${agent.badgeClass}`}>{agent.badge}</span>
              ) : (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  color: agent.color,
                  background: `#F0F3F1`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1px solid #E3E7E4`
                }}>
                  {agent.badge}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#17201C', marginBottom: '0.25rem' }}>
              {agent.primaryOutput}
            </div>

            <p style={{ fontSize: '0.75rem', color: '#66716B', lineHeight: '1.35', margin: 0 }}>
              {agent.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
