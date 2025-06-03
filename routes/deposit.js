const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

router.post('/:telegramId', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { telegramId } = req.params;
    const { tonAmount } = req.body;

    if (!tonAmount || tonAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Некорректная сумма депозита, братан!' });
    }

    const user = await User.findOne({ telegramId }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    // Конвертируем TON в звёздочки (1 TON = 100 звёздочек)
    const starsToAdd = Math.floor(tonAmount * 100);

    // Обновляем баланс атомарно
    user.balance += starsToAdd;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      starsAdded: starsToAdd,
      message: `Начислено ${starsToAdd} ⭐ за ${tonAmount} TON!`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;