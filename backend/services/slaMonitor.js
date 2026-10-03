/**
 * SLA Monitor Service
 * Background engine that periodically audits active complaints for SLA deadline proximity
 * and automatically triggers escalation and reminders on breach.
 */

const { escalateTicket } = require('../agents/escalationAgent');

function startSLAMonitor(getComplaintsFn, updateComplaintFn, intervalMs = 10000) {
  console.log('⏰ SLA Monitoring Engine started (Audit interval: ' + (intervalMs / 1000) + 's)');

  const intervalId = setInterval(async () => {
    try {
      const now = new Date();
      const complaints = await getComplaintsFn();

      for (const complaint of complaints) {
        // Only check unresolved complaints
        if (complaint.status === 'RESOLVED') continue;

        const dueAt = new Date(complaint.dueAt);
        const timeRemainingMs = dueAt.getTime() - now.getTime();

        // 1. Reminder Check (If deadline is within 2 hours or breached, send reminder)
        if (timeRemainingMs < 2 * 60 * 60 * 1000 && !complaint.reminderSent) {
          console.log(`🔔 SLA REMINDER: Ticket #${complaint.ticketId} is approaching/past deadline!`);
          await updateComplaintFn(complaint.ticketId, { reminderSent: true });
        }

        // 2. SLA Breach Check
        if (now > dueAt && (!complaint.escalated || complaint.status !== 'ESCALATED')) {
          console.warn(`🚨 SLA BREACH: Ticket #${complaint.ticketId} breached SLA! Escalating...`);
          const escalation = await escalateTicket(complaint, 'Automatic SLA Breach');
          await updateComplaintFn(complaint.ticketId, escalation);
        }
      }
    } catch (err) {
      console.error('Error in SLA Monitor cycle:', err.message);
    }
  }, intervalMs);

  return intervalId;
}

module.exports = { startSLAMonitor };
