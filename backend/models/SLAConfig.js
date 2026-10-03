const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema({
  priority: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], required: true, unique: true },
  hours: { type: Number, required: true },
  description: { type: String, default: '' }
});

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
