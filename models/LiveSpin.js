const mongoose = require('mongoose');

const liveSpinSchema = new mongoose.Schema({
  giftId: { type: String, required: true },
  caseId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LiveSpin', liveSpinSchema);