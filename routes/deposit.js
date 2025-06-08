const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const mongoose = require('mongoose');
const { registerUserAddress } = require('../services/tonMonitor');

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
      // Обрабатываем Telegram Stars
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
      // Для TON только регистрируем адрес, начисление через tonMonitor
      await registerUserAddress(telegramId, tonAddress);
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      totalDeposits: user.totalDeposits,
      starsAdded: starsToAdd || 0,
      message: starsAmount
        ? `Начислено ${starsToAdd} ⭐ за ${amount} STARS!`
        : 'Транзакция TON отправлена, жди начисления звёздочек!',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

router.get('/status/:telegramId/:txHash', async (req, res) => {
  const { telegramId, txHash } = req.params;

  try {
    const deposit = await Deposit.findOne({ telegramId, transactionId: txHash });
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    if (deposit) {
      return res.json({
        status: 'completed',
        newBalance: user.balance,
        starsAdded: deposit.starsAdded,
        message: `Начислено ${deposit.starsAdded} ⭐ за ${deposit.amount} TON!`,
      });
    } else {
      return res.json({
        status: 'pending',
        newBalance: user.balance,
        message: 'Транзакция в обработке, жди!',
      });
    }
  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;