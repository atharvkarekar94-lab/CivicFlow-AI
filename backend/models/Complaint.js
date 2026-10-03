const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  citizenName: { type: String, required: true },

  citizenPhone: { type: String, default: '' },
  citizenEmail: { type: String, default: '' },
  description: { type: String, required: true },

location: {
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
},

  category: { type: String, required: true },
  department: { type: String, required: true },
  priority: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], required: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'], default: 'OPEN' },
  slaHours: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  dueAt: { type: Date, required: true },
  resolvedAt: { type: Date, default: null },
  escalated: { type: Boolean, default: false },
  escalationLevel: { type: Number, default: 0 },
  escalationReason: { type: String, default: '' },
  reminderSent: { type: Boolean, default: false },
  aiConfidence: { type: Number, default: 0.95 },
  aiReasoning: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
