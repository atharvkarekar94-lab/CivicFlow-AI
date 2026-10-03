const express = require('express');
const router = express.Router();
const ticketStore = require('../services/ticketStore');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/admin/stats - Admin Dashboard Statistics (STAFF & SUPER_ADMIN)
router.get('/stats', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const stats = await ticketStore.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to compute admin statistics.' });
  }
});

// GET /api/admin/recent - Recent complaints (STAFF & SUPER_ADMIN)
router.get('/recent', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const complaints = await ticketStore.getAllComplaints();
    res.json(complaints.slice(0, 5));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent tickets.' });
  }
});

// POST /api/admin/seed - Seed demo tickets (SUPER_ADMIN only)
router.post('/seed', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const result = await ticketStore.seedComplaints();
    res.json(result);
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ error: 'Failed to seed demo data.' });
  }
});

module.exports = router;

