const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCoder');
const User = require('../models/User');

router.post('/activate', async (req, res) => {
  try {
    const { telegramId, code } = req.body;

    if (!telegramId || !code) {
      return res.status(400).json({ message: 'Требуются идентификатор Telegram и промокод' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const promoCode = await PromoCode.findOne({ code });
    if (!promoCode) {
      return res.status(400).json({ message: 'Неверный промокод' });
    }

    if (!promoCode.isActive || promoCode.activationsUsed >= promoCode.maxActivations) {
      return res.status(400).json({ message: 'Промокод неактивен или исчерпан' });
    }

    // Проверяем, не активировал ли пользователь этот промокод
    if (promoCode.activatedBy.includes(telegramId)) {
      return res.status(400).json({ message: 'Промокод уже активирован этим пользователем' });
    }

    // Начисляем звёзды
    user.balance += promoCode.stars;
    promoCode.activationsUsed += 1;
    promoCode.activatedBy.push(telegramId);
    if (promoCode.activationsUsed >= promoCode.maxActivations) {
      promoCode.isActive = false;
    }

    await user.save();
    await promoCode.save();

    res.json({
      message: `Промокод активирован. Начислено ${promoCode.stars} звёзд`,
      newBalance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;