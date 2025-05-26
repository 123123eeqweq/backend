const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Эндпоинт для логина/регистрации
router.post('/login', async (req, res) => {
  try {
    const { telegramId, firstName, photoUrl, refId } = req.body;

    if (!telegramId || !firstName) {
      return res.status(400).json({ message: 'Telegram ID и имя нужны, братан!' });
    }

    let user = await User.findOne({ telegramId });
    if (user) {
      // Юзер уже существует, реферал не учитывается
      return res.json({
        id: user.telegramId,
        firstName: user.firstName,
        photoUrl: user.photoUrl,
        balance: user.balance,
        inventory: user.inventory,
      });
    }

    // Новый юзер
    user = new User({
      telegramId,
      firstName,
      photoUrl: photoUrl || 'https://via.placeholder.com/40',
      balance: 200,
      inventory: [],
    });

    // Если есть refId, проверяем реферера
    if (refId) {
      const referrer = await User.findOne({ telegramId: refId });
      if (referrer) {
        user.invitedBy = refId;
        referrer.referrals.push(telegramId);
        await referrer.save();
      }
    }

    await user.save();

    res.json({
      id: user.telegramId,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      inventory: user.inventory,
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;