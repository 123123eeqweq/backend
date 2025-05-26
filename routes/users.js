const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Эндпоинт для получения данных юзера
router.get('/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }
    res.json({
      telegramId: user.telegramId,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      inventory: user.inventory,
    });
  } catch (error) {
    console.error('Ошибка при загрузке юзера:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;