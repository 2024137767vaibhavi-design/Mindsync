const mongoose = require('mongoose');

const EmergencyLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: String,
  location: String,
  resolved: { type: Boolean, default: false }
});

module.exports = mongoose.model('EmergencyLog', EmergencyLogSchema);