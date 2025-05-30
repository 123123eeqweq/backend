const express = require('express');
const router = express.Router();
const PromoCode = require('/models/PromoCode');
const User = require('../models/User');

router.post('/activate', async (req, res) => {
  try {
    const { telegramId, code } = req.body;

    if (!telegramId || !code) {
      return res.status(400).json({ message: 'Требуется Telegram ID и промокод' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const promo = await PromoCode.findOne({ code });
    if (!promo) {
      return res.status(400).json({ message: 'Неверный промокод' });
    }

    if (promo.activations >= promo.maxActivations) {
      return res.status(400).json({ message: 'Промокод исчерпан' });
    }

    if (promo.usedBy.includes(telegramId)) {
      return res.status(400).json({ message: 'Вы уже активировали этот промокод' });
    }

    // Начисляем звёзды
    user.balance += promo.stars;
    promo.activations += 1;
    promo.usedBy.push(telegramId);

    await user.save();
    await promo.save();

    res.json({
      message: `Промокод активирован! Начислено ${promo.stars} ⭐`,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error('Ошибка активации промокода:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;