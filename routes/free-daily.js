const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Эндпоинт для проверки статуса Free Daily
router.get('/status/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const now = new Date();
    const lastSpin = user.lastFreeDailySpin;
    const isAvailable = !lastSpin || (now - lastSpin) >= 24 * 60 * 60 * 1000; // 24 часа в мс
    const timeLeft = isAvailable ? 0 : 24 * 60 * 60 * 1000 - (now - lastSpin); // Время до следующего спина

    res.json({
      isAvailable,
      timeLeft: Math.floor(timeLeft / 1000), // В секундах
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;