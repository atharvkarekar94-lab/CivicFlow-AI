/**
 * Escalation Agent
 * Handles ticket escalation when SLAs are breached or manually escalated.
 */

const ESCALATION_LEVELS = {
  1: {
    role: 'Department Officer',
    description: 'Initial departmental notice issued to primary field supervisor.'
  },
  2: {
    role: 'Senior Municipal Officer',
    description: 'Escalated to Zonal Executive Engineer & Senior Municipal Officer.'
  },
  3: {
    role: 'Municipal Administrator',
    description: 'Critical escalation dispatched to Chief Municipal Commissioner & Administrator.'
  }
};

async function escalateTicket(complaint, reason = 'SLA breached') {
  const currentLevel = complaint.escalationLevel || 0;
  const nextLevel = Math.min(currentLevel + 1, 3);
  const escalationInfo = ESCALATION_LEVELS[nextLevel];

  const updatedData = {
    escalated: true,
    status: 'ESCALATED',
    escalationLevel: nextLevel,
    escalationReason: `${reason} - Escalated to Level ${nextLevel} (${escalationInfo.role})`,
    reminderSent: true
  };

  return {
    ...updatedData,
    levelDetails: escalationInfo,
    agentMessage: `Escalation Agent activated. Ticket #${complaint.ticketId} elevated to Level ${nextLevel}: ${escalationInfo.role}.`
  };
}

module.exports = { escalateTicket, ESCALATION_LEVELS };
