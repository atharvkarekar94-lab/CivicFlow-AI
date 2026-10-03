const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const slaRoutes = require('./routes/slaRoutes');
const { startSLAMonitor } = require('./services/slaMonitor');
const ticketStore = require('./services/ticketStore');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sla', slaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CivicFlow AI',
    mongoConnected: ticketStore.getIsMongoConnected(),
    timestamp: new Date().toISOString()
  });
});

// Root API route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to CivicFlow AI API - Multi-Agent Municipal Complaint Router',
    endpoints: [
      'POST /api/complaints',
      'GET /api/complaints',
      'GET /api/complaints/:ticketId',
      'PUT /api/complaints/:ticketId/status',
      'POST /api/complaints/:ticketId/simulate-breach',
      'GET /api/admin/stats',
      'POST /api/admin/seed',
      'GET /api/sla/config'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Connect to MongoDB & Start Server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicflow_db';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 3000 // Fast fail if local Mongo server isn't running
})
.then(async () => {
  console.log('✅ Connected to MongoDB successfully.');
  ticketStore.setMongoConnected(true);
  if (authRoutes.seedDefaultUsers) {
    await authRoutes.seedDefaultUsers();
  }
})
.catch((err) => {
  console.warn('⚠️ MongoDB connection omitted or unreachable:', err.message);
  console.warn('⚡ Operating seamlessly in In-Memory Engine Fallback Mode.');
  ticketStore.setMongoConnected(false);
})
.finally(() => {
  // Start SLA Monitoring engine
  startSLAMonitor(
    () => ticketStore.getAllComplaints(),
    (ticketId, data) => ticketStore.updateComplaint(ticketId, data),
    10000 // audit every 10s for fast live hackathon demo
  );

  app.listen(PORT, () => {
    console.log(`CivicFlow AI server running on http://localhost:${PORT}`);
  });
});
