const express = require('express');
const router = express.Router();

const { analyzeComplaint } = require('../agents/understandingAgent');
const { classifyComplaint } = require('../agents/classificationAgent');
const { routeComplaint } = require('../agents/routingAgent');
const { calculatePriority } = require('../agents/priorityAgent');
const { calculateSLA } = require('../agents/slaAgent');
const { escalateTicket } = require('../agents/escalationAgent');
const ticketStore = require('../services/ticketStore');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// POST /api/complaints - Create complaint & execute multi-agent workflow (Authenticated Citizens)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { citizenName, citizenPhone, citizenEmail, description, location } = req.body;

    if (!description || !citizenName) {
      return res.status(400).json({ error: 'Citizen name and complaint description are required.' });
    }

    // Step 1: Understanding Agent
    const understandingResult = await analyzeComplaint(description);

    // Step 2: Classification Agent
    const classificationResult = await classifyComplaint(description);

    // Step 3: Routing Agent
    const routingResult = await routeComplaint(classificationResult.category);

    // Step 4: Priority Agent
    const priorityResult = await calculatePriority(description, classificationResult.category);

    // Step 5: SLA Agent
    const slaResult = await calculateSLA(priorityResult.priority);

    // Step 6: Create Ticket Record linked to Authenticated Citizen
    const complaintData = {
      userId: req.user.id,
      citizenName,
      citizenPhone: citizenPhone || '',
      citizenEmail: citizenEmail || req.user.email || '',
      description,
      location: location || { latitude: 0, longitude: 0 },
      category: classificationResult.category,
      department: routingResult.department,
      priority: priorityResult.priority,
      status: 'OPEN',
      slaHours: slaResult.slaHours,
      createdAt: slaResult.createdAt,
      dueAt: slaResult.dueAt,
      resolvedAt: null,
      escalated: false,
      escalationLevel: 0,
      escalationReason: '',
      reminderSent: false,
      aiConfidence: classificationResult.confidence,
      aiReasoning: `${classificationResult.reasoning} | ${routingResult.reasoning} | ${priorityResult.reasoning}`
    };

    const savedTicket = await ticketStore.createComplaint(complaintData);

    // Response includes detailed multi-agent telemetry for UI visualization
    res.status(201).json({
      ticket: savedTicket,
      agentTelemetry: {
        understanding: understandingResult,
        classification: classificationResult,
        routing: routingResult,
        priority: priorityResult,
        sla: slaResult
      }
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to process complaint and execute AI agents.' });
  }
});

// GET /api/complaints - Get all complaints (STAFF & SUPER_ADMIN only)
router.get('/', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const complaints = await ticketStore.getAllComplaints();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// GET /api/complaints/my - Get complaints belonging to logged-in citizen (CITIZEN only)
router.get('/my', authenticateToken, requireRole('CITIZEN'), async (req, res) => {
  try {
    const complaints = await ticketStore.getComplaintsByUserId(req.user.id);
    res.json({
      success: true,
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching citizen complaints:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch your complaints.' });
  }
});

// GET /api/complaints/:ticketId - Get single complaint by ticket ID
router.get('/:ticketId', async (req, res) => {

  try {
    const complaint = await ticketStore.getComplaintByTicketId(req.params.ticketId);
    if (!complaint) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket details.' });
  }
});

// PUT /api/complaints/:ticketId/status - Update ticket status (STAFF & SUPER_ADMIN)
router.put('/:ticketId/status', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updateData = { status };
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await ticketStore.updateComplaint(req.params.ticketId, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket status.' });
  }
});

// POST /api/complaints/:ticketId/escalate - Manually trigger escalation (STAFF & SUPER_ADMIN)
router.post('/:ticketId/escalate', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const complaint = await ticketStore.getComplaintByTicketId(req.params.ticketId);
    if (!complaint) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const escalation = await escalateTicket(complaint, req.body.reason || 'Manual Administrative Escalation');
    const updated = await ticketStore.updateComplaint(req.params.ticketId, escalation);

    res.json({
      message: 'Ticket successfully escalated',
      ticket: updated
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to escalate ticket.' });
  }
});

// POST /api/complaints/:ticketId/simulate-breach - Instantly simulate SLA Breach & activate Escalation Agent (SUPER_ADMIN only)
router.post('/:ticketId/simulate-breach', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const complaint = await ticketStore.getComplaintByTicketId(req.params.ticketId);
    if (!complaint) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Set dueAt to 1 hour in the past
    const pastDueAt = new Date(Date.now() - 60 * 60 * 1000);
    const escalationResult = await escalateTicket(complaint, 'SIMULATED DEMO BREACH: Deadline Expired');
    
    const breachData = {
      dueAt: pastDueAt,
      ...escalationResult
    };

    const updated = await ticketStore.updateComplaint(req.params.ticketId, breachData);

    res.json({
      message: 'SLA Breach simulated successfully! Escalation agent activated.',
      ticket: updated
    });
  } catch (error) {
    console.error('Simulate breach error:', error);
    res.status(500).json({ error: 'Failed to simulate SLA breach.' });
  }
});

module.exports = router;

