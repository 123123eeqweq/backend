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

    user.balance += starsToAdd;
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

// Новый эндпоинт для админского начисления
router.post('/admin/deposit', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { telegramId, starsAmount, password } = req.body;

    // Проверка входных данных
    if (!telegramId || !starsAmount || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Все поля обязательны, братан!' });
    }

    if (isNaN(starsAmount) || starsAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Сумма должна быть больше 0, братан!' });
    }

    // Проверка пароля (захардкодим для простоты)
    if (password !== '1234') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Неверный пароль, попробуй ещё!' });
    }

    const user = await User.findOne({ telegramId }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Юзер не найден, проверь ID!' });
    }

    const starsToAdd = Math.floor(starsAmount);
    user.balance += starsToAdd;
    await user.save({ session });

    // Логируем депозит
    const deposit = new Deposit({
      telegramId,
      amount: starsToAdd,
      starsAdded: starsToAdd,
      currency: 'ADMIN_STARS',
      transactionId: `ADMIN_${Date.now()}`,
    });
    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      newBalance: user.balance,
      starsAdded: starsToAdd,
      message: `Начислено ${starsToAdd} ⭐ юзеру ${telegramId}!`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка админского депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;