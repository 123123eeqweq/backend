const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  stars: { type: Number, required: true },
  maxActivations: { type: Number, required: true, default: 1 },
  activationsUsed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  activatedBy: [{ type: String }],
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);