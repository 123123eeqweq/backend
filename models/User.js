const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  photoUrl: { type: String, default: 'https://via.placeholder.com/40' },
  balance: { type: Number, default: 0 },
  inventory: [{ giftId: String, name: String, image: String, price: Number }],
  createdAt: { type: Date, default: Date.now },
  lastFreeDailySpin: { type: Date, default: null },
  invitedBy: { type: String, default: null }, // Telegram ID реферера
  referrals: [{ type: String }], // Telegram ID рефералов
  referralBonus: { type: Number, default: 0 }, // Бонус от рефералов
});

module.exports = mongoose.model('User', userSchema);