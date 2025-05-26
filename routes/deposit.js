const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Эндпоинт для депозита (заглушка)
router.post('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Сумма депозита нужна, братан!' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    // Увеличиваем баланс
    user.balance += amount;
    await user.save();

    // Начисляем бонус рефереру (10% от депозита)
    if (user.invitedBy) {
      const referrer = await User.findOne({ telegramId: user.invitedBy });
      if (referrer) {
        const bonus = Math.floor(amount * 0.1);
        referrer.referralBonus += bonus;
        referrer.balance += bonus; // Добавляем бонус к балансу реферера
        await referrer.save();
      }
    }

    res.json({
      newBalance: user.balance,
      message: 'Депозит зачислен, братан!',
    });
  } catch (error) {
    console.error('Ошибка при депозите:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;