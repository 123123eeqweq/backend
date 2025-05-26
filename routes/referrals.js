const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Эндпоинт для получения реферальной статистики
router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    // Считаем рефералов, сделавших депозит
    const depositedReferrals = await User.countDocuments({
      invitedBy: telegramId,
      balance: { $gt: 200 }, // Предполагаем, что депозит увеличивает баланс выше начальных 200
    });

    res.json({
      referralLink: `t.me/MyBot?start=ref_${telegramId}`,
      invitedCount: user.referrals.length,
      depositedCount: depositedReferrals,
      referralBonus: user.referralBonus,
    });
  } catch (error) {
    console.error('Ошибка при загрузке реферальной статистики:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;