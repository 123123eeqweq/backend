const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const mongoose = require('mongoose');
const axios = require('axios');

const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '287b327b58b0418ad1092935c34f3da7292b343870addef6faf30ee04ecf6279';
const WALLET_ADDRESS = 'UQCeRGv6Nf-wnlAKYstkW7UKefuEt8n2dI1u_OOrysYvq8hC';

// Функция проверки транзакции через Toncenter API
async function checkTonTransaction(transactionId, amount) {
  try {
    const response = await axios.get(`https://toncenter.com/api/v2/getTransactions`, {
      params: {
        address: WALLET_ADDRESS,
        limit: 10,
        api_key: TONCENTER_API_KEY,
      },
    });

    const transactions = response.data.result;
    const tx = transactions.find((t) => {
      const comment = Buffer.from(t.in_msg?.message, 'base64').toString();
      const txAmount = parseInt(t.in_msg?.value) / 1_000_000_000; // Конвертируем нанотоне в TON
      return comment === transactionId && txAmount === amount;
    });

    return tx ? 'confirmed' : 'pending';
  } catch (error) {
    console.error('Ошибка Toncenter API:', error);
    return 'failed';
  }
}

// Фоновый polling для проверки pending-транзакций
async function startTransactionPolling() {
  setInterval(async () => {
    const pendingDeposits = await Deposit.find({ status: 'pending', currency: 'TON' });
    for (const deposit of pendingDeposits) {
      const status = await checkTonTransaction(deposit.transactionId, deposit.amount);
      if (status === 'confirmed') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const user = await User.findOne({ telegramId: deposit.telegramId }).session(session);
          if (user) {
            user.balance += deposit.starsAdded;
            user.totalDeposits += deposit.starsAdded;
            await user.save({ session });
          }
          deposit.status = 'confirmed';
          await deposit.save({ session });
          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          console.error('Ошибка обработки депозита:', error);
        } finally {
          session.endSession();
        }
      } else if (status === 'failed') {
        deposit.status = 'failed';
        await deposit.save();
      }
    }
  }, 10_000); // Проверяем каждые 10 сек
}

// Запускаем polling при старте сервера
startTransactionPolling();

// Создание pending-депозита
router.post('/pending/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { tonAmount, transactionId } = req.body;

    if (!tonAmount || tonAmount <= 0) {
      return res.status(400).json({ message: 'Некорректная сумма депозита, братан!' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    const starsToAdd = Math.floor(tonAmount * 100);
    const deposit = new Deposit({
      telegramId,
      amount: tonAmount,
      starsAdded: starsToAdd,
      currency: 'TON',
      transactionId,
      status: 'pending',
    });
    await deposit.save();

    res.json({ message: 'Транзакция зарегистрирована, ждём подтверждения!' });
  } catch (error) {
    console.error('Ошибка создания pending-депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

// Проверка статуса транзакции
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const deposit = await Deposit.findOne({ transactionId });

    if (!deposit) {
      return res.status(404).json({ status: 'not_found', message: 'Транзакция не найдена!' });
    }

    if (deposit.status === 'pending') {
      const status = await checkTonTransaction(deposit.transactionId, deposit.amount);
      deposit.status = status;
      await deposit.save();
    }

    res.json({ status: deposit.status, message: `Транзакция в статусе ${deposit.status}` });
  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

// Подтверждение депозита
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
    const deposit = await Deposit.findOneAndUpdate(
      { transactionId },
      {
        telegramId,
        amount,
        starsAdded: starsToAdd,
        currency,
        transactionId,
        status: 'confirmed',
      },
      { upsert: true, new: true, session }
    );

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

module.exports = router;