/**
 * SLA Agent
 * Calculates dynamic resolution deadlines (dueAt) based on ticket priority and configured SLA policies.
 */

const DEFAULT_SLA_HOURS = {
  CRITICAL: 6,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72
};

async function calculateSLA(priority, customSlaConfig = null) {
  const slaHours = customSlaConfig && customSlaConfig[priority] 
    ? customSlaConfig[priority] 
    : (DEFAULT_SLA_HOURS[priority] || 24);

  const createdAt = new Date();
  const dueAt = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);

  return {
    slaHours,
    createdAt,
    dueAt,
    reasoning: `Assigned ${slaHours}-hour resolution SLA strictly determined by ${priority} severity policy.`
  };
}

module.exports = { calculateSLA, DEFAULT_SLA_HOURS };
