const mongoose = require('mongoose');

const pendingDepositSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  depositId: { type: String, required: true, unique: true }, // Уникальный ID депозита
  amount: { type: Number, required: true }, // Сумма в TON
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  transactionHash: { type: String }, // Хэш транзакции (если известен)
  createdAt: { type: Date, default: Date.now, expires: '1h' }, // Автоудаление через 1 час
});

module.exports = mongoose.model('PendingDeposit', pendingDepositSchema);