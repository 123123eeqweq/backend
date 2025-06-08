const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Получение данных юзера
router.get('/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      telegramId: user.telegramId,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      diamonds: user.diamonds,
      inventory: user.inventory,
      totalDeposits: user.totalDeposits,
      openedTopupCases: user.openedTopupCases,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Начисление баланса
router.post('/add-balance', async (req, res) => {
  const { telegramId, amount, type = 'stars' } = req.body;

  // Валидация
  if (!telegramId || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Некорректные данные' });
  }
  if (!['stars', 'diamonds'].includes(type)) {
    return res.status(400).json({ message: 'Тип должен быть stars или diamonds' });
  }

  try {
    const update = type === 'diamonds' ? { diamonds: amount } : { balance: amount };
    const user = await User.findOneAndUpdate(
      { telegramId },
      { $inc: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден' });
    }

    res.json({ message: `Начислено ${amount} ${type} юзеру ${telegramId}` });
  } catch (error) {
    console.error('Error adding balance:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;