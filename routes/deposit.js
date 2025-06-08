const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const PendingDeposit = require('../models/PendingDeposit');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const TonWeb = require('tonweb');

// Настройка TonWeb для мониторинга (замените на свои данные)
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));
const WALLET_ADDRESS = 'UQCeRGv6Nf-wnlAKYstkW7UKefuEt8n2dI1u_OOrysYvq8hC';

// Создание ожидающего депозита
router.post('/pending/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { tonAmount } = req.body;

    if (!tonAmount || tonAmount <= 0) {
      return res.status(400).json({ message: 'Некорректная сумма депозита, братан!' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    const depositId = uuidv4();
    const pendingDeposit = new PendingDeposit({
      telegramId,
      depositId,
      amount: tonAmount,
      status: 'pending',
    });
    await pendingDeposit.save();

    res.json({ depositId, message: 'Ожидающий депозит создан, отправляй TON!' });
  } catch (error) {
    console.error('Ошибка создания депозита:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

// Проверка статуса депозита
router.get('/status/:depositId', async (req, res) => {
  try {
    const { depositId } = req.params;
    const pendingDeposit = await PendingDeposit.findOne({ depositId });

    if (!pendingDeposit) {
      return res.status(404).json({ message: 'Депозит не найден!' });
    }

    res.json({ status: pendingDeposit.status, starsAdded: pendingDeposit.status === 'confirmed' ? Math.floor(pendingDeposit.amount * 100) : 0 });
  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

// Функция мониторинга транзакций (запускать отдельно, например, через cron или worker)
async function monitorDeposits() {
  try {
    const pendingDeposits = await PendingDeposit.find({ status: 'pending' });

    for (const deposit of pendingDeposits) {
      // Проверяем транзакции на кошелёк
      const transactions = await tonweb.getTransactions(WALLET_ADDRESS);
      const matchingTx = transactions.find(
        (tx) =>
          tx.in_msg &&
          tx.in_msg.value === Math.floor(deposit.amount * 1_000_000_000).toString() &&
          new Date(tx.utime * 1000) > new Date(deposit.createdAt)
      );

      if (matchingTx) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const user = await User.findOne({ telegramId: deposit.telegramId }).session(session);
          const starsToAdd = Math.floor(deposit.amount * 100);
          user.balance += starsToAdd;
          user.totalDeposits += starsToAdd;
          await user.save({ session });

          const newDeposit = new Deposit({
            telegramId: deposit.telegramId,
            amount: deposit.amount,
            starsAdded,
            currency: 'TON',
            transactionId: matchingTx.transaction_id.hash,
          });
          await newDeposit.save({ session });

          deposit.status = 'confirmed';
          deposit.transactionHash = matchingTx.transaction_id.hash;
          await deposit.save({ session });

          await session.commitTransaction();
          session.endSession();
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          console.error('Ошибка обработки депозита:', error);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка мониторинга:', error);
  }
}

// Запуск мониторинга (например, каждые 10 секунд)
setInterval(monitorDeposits, 10_000);

module.exports = router;