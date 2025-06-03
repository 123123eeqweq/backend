const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const mongoose = require('mongoose');

router.post('/:telegramId', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { telegramId } = req.params;
    const { tonAmount, starsAmount, transactionId } = req.body;

    if ((!tonAmount && !starsAmount) || (tonAmount && tonAmount <= 0) || (starsAmount && starsAmount <= 0)) {
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

    let starsToAdd = 0;
    let currency = '';
    let amount = 0;

    if (tonAmount) {
      // Депозит в TON: 1 TON = 100 звёздочек
      starsToAdd = Math.floor(tonAmount * 100);
      currency = 'TON';
      amount = tonAmount;
    } else if (starsAmount) {
      // Депозит в Telegram Stars: 1 Star = 1 звёздочка
      starsToAdd = Math.floor(starsAmount);
      currency = 'STARS';
      amount = starsAmount;
    }

    // Обновляем баланс
    user.balance += starsToAdd;
    await user.save({ session });

    // Логируем депозит
    const deposit = new Deposit({
      telegramId,
      amount,
      starsAdded,
      currency,
      transactionId: transactionId || null,
    });
    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      starsAdded,
      message: `Начислено ${starsToAdd} ⭐ за ${amount} ${currency}!`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;