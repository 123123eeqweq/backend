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
      return res.status(400).json({ message: 'Некорректная сумма депозита, братан!' });
    }

    const user = await User.findOne({ telegramId }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    let starsToAdd;
    if (currency === 'TON') {
      starsToAdd = Math.floor(amount * 100); // 1 TON = 100 звёздочек
    } else if (currency === 'STARS') {
      starsToAdd = Math.floor(amount); // Звёздочки 1:1
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Неподдерживаемая валюта, братан!' });
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
      message: `Начислено ${starsToAdd} ⭐ за ${amount} ${currency}!`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
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
    console.error('Ошибка проверки депозитов:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;