const express = require('express');
const router = express.Router();
const { DEFAULT_SLA_HOURS } = require('../agents/slaAgent');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

let activeSLAConfig = { ...DEFAULT_SLA_HOURS };

// GET /api/sla/config
router.get('/config', (req, res) => {
  res.json({
    config: activeSLAConfig,
    description: 'Dynamic SLA configuration per severity level'
  });
});

// PUT /api/sla/config - Update SLA hours (SUPER_ADMIN only)
router.put('/config', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  const { CRITICAL, HIGH, MEDIUM, LOW } = req.body;
  if (CRITICAL) activeSLAConfig.CRITICAL = Number(CRITICAL);
  if (HIGH) activeSLAConfig.HIGH = Number(HIGH);
  if (MEDIUM) activeSLAConfig.MEDIUM = Number(MEDIUM);
  if (LOW) activeSLAConfig.LOW = Number(LOW);

  res.json({
    message: 'SLA Configuration updated successfully',
    config: activeSLAConfig
  });
});

module.exports = router;
