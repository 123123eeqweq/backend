const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  amount: { type: Number, required: true }, // Сумма в TON или Telegram Stars
  starsAdded: { type: Number, required: true }, // Начисленные звёздочки
  currency: { type: String, enum: ['TON', 'STARS'], required: true },
  transactionId: { type: String }, // ID транзакции (для Stars или TON)
  createdAt: { type: Date, default: Date.now },
});

// Индекс для быстрого поиска по transactionId
depositSchema.index({ telegramId: 1, transactionId: 1 });

module.exports = mongoose.model('Deposit', depositSchema);