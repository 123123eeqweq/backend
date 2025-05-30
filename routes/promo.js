const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCoder');
const User = require('../models/User');

router.post('/activate', async (req, res) => {
  try {
    const { telegramId, code } = req.body;
    console.log('Promo activation request:', { telegramId, code });

    if (!telegramId || !code) {
      console.log('Missing telegramId or code');
      return res.status(400).json({ message: 'Требуется Telegram ID и промокод' });
    }

    const user = await User.findOne({ telegramId });
    console.log('User found:', !!user);
    if (!user) {
      console.log('User not found for telegramId:', telegramId);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const promoCode = await PromoCode.findOne({ code });
    console.log('PromoCode found:', !!promoCode, 'Code:', code);
    if (!promoCode) {
      console.log('Invalid promo code:', code);
      return res.status(400).json({ message: 'Неверный промокод' });
    }

    if (!promoCode.isActive || promoCode.activationsUsed >= promoCode.maxActivations) {
      console.log('Promo code inactive or used up:', {
        isActive: promoCode.isActive,
        activationsUsed: promoCode.activationsUsed,
        maxActivations: promoCode.maxActivations,
      });
      return res.status(400).json({ message: 'Промокод неактивен или уже использован' });
    }

    // Начисляем звёзды
    console.log('Activating promo, adding stars:', promoCode.stars);
    user.balance += promoCode.stars;
    promoCode.activationsUsed += 1;
    if (promoCode.activationsUsed >= promoCode.maxActivations) {
      promoCode.isActive = false;
    }

    await user.save();
    await promoCode.save();

    console.log('Promo activated successfully:', {
      newBalance: user.balance,
      activationsUsed: promoCode.activationsUsed,
    });

    res.json({
      message: `Промокод активирован! Зачислено ${promoCode.stars} ⭐`,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error('Ошибка активации промокода:', error.message, error.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;