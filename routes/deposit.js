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
    const { tonAmount, starsAmount, transactionId, tonAddress } = req.body;

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

    if (starsAmount) {
      starsToAdd = Math.floor(starsAmount);
      currency = 'STARS';
      amount = starsAmount;

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
    } else if (tonAmount && tonAddress) {
      user.tonAddress = tonAddress;
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      totalDeposits: user.totalDeposits,
      starsAdded: starsToAdd || 0,
      message: starsAmount
        ? `Начислено ${starsToAdd} ⭐ за ${amount} STARS!`
        : 'Транзакция TON отправлена, звёздочки придут через 10-30 сек!',
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
      user: user ? { balance: user.balance, tonAddress: user.tonAddress } : null,
      deposits,
    });
  } catch (error) {
    console.error('Ошибка проверки депозитов:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

router.post('/manual/:telegramId', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { telegramId } = req.params;
    const { tonAmount } = req.body;

    if (!tonAmount || tonAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Некорректная сумма, братан!' });
    }

    const user = await User.findOne({ telegramId }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    const starsToAdd = Math.floor(tonAmount * 100);
    user.balance += starsToAdd;
    user.totalDeposits += starsToAdd;
    await user.save({ session });

    const deposit = new Deposit({
      telegramId,
      amount: tonAmount,
      starsAdded: starsToAdd,
      currency: 'TON',
      transactionId: 'manual',
    });
    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      message: `Начислено ${starsToAdd} ⭐ за ${tonAmount} TON!`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;