const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  contactEmail: { type: String, default: '' },
  activeTickets: { type: Number, default: 0 }
});

module.exports = mongoose.model('Department', departmentSchema);
