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
      starsToAdd = Math.floor(tonAmount * 100);
      currency = 'TON';
      amount = tonAmount;
    } else if (starsAmount) {
      starsToAdd = Math.floor(starsAmount);
      currency = 'STARS';
      amount = starsAmount;
    }

    // Обновляем баланс и totalDeposits
    user.balance += starsToAdd;
    user.totalDeposits += starsToAdd;
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
      totalDeposits: user.totalDeposits, // Возвращаем для фронта
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