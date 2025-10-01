const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({
  heartRate: String,
  stressLevel: String,
  sleepHours: String,
  bp: String,
  ecg: String,
  temperature: String,
  energy: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vital', VitalSchema);