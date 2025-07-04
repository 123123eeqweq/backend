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
    const { amount, currency, transactionId } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Некорректная сумма депозита' });
    }

    const user = await User.findOne({ telegramId }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    let starsToAdd;
    if (currency === 'TON') {
      starsToAdd = Math.floor(amount * 100); // 1 TON = 100 звёзд
    } else if (currency === 'STARS') {
      starsToAdd = Math.floor(amount); // Звёзды 1:1
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Неподдерживаемая валюта' });
    }

    user.balance += starsToAdd;
    user.totalDeposits += starsToAdd;
    await user.save({ session });

    const deposit = new Deposit({
      telegramId,
      amount,
      starsAdded: starsToAdd,
      currency,
      transactionId: transactionId || null,
    });
    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      totalDeposits: user.totalDeposits,
      starsAdded: starsToAdd,
      message: `Начислено ${starsToAdd} звёзд за ${amount} ${currency}`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const deposits = await Deposit.find({ telegramId });
    const user = await User.findOne({ telegramId });
    res.json({
      user: user ? { balance: user.balance } : null,
      deposits,
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;