const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  amount: { type: Number, required: true },
  starsAdded: { type: Number, required: true },
  currency: { type: String, enum: ['STARS'], required: true },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

depositSchema.index({ telegramId: 1, transactionId: 1 });

module.exports = mongoose.model('Deposit', depositSchema);