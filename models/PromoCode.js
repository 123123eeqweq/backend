const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  stars: { type: Number, required: true },
  maxActivations: { type: Number, default: 1 },
  activations: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  usedBy: [{ type: String }], // Список telegramId юзеров, активировавших код
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);