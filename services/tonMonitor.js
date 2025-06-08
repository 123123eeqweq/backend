const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const User = require('../models/User');
const Deposit = require('../models/Deposit');

const WALLET_ADDRESS = 'UQCeRGv6Nf-wnlAKYstkW7UKefuEt8n2dI1u_OOrysYvq8hC';
const TONCENTER_API = 'https://toncenter.com/api/v2/getTransactions';
const API_KEY = '287b327b58b0418ad1092935c34f3da7292b343870addef6faf30ee04ecf6279';

async function processTransactions() {
  try {
    const response = await axios.get(TONCENTER_API, {
      params: {
        address: WALLET_ADDRESS,
        limit: 20,
        archival: true,
      },
      headers: API_KEY ? { 'X-Api-Key': API_KEY } : {},
    });

    const transactions = response.data.result;

    for (const tx of transactions) {
      if (tx.out_msgs.length > 0) continue;

      const txHash = tx.transaction_id.hash;
      const amountNanotons = tx.in_msg.value;
      const amountTon = amountNanotons / 1_000_000_000;
      const senderAddress = tx.in_msg.source;

      console.log(`Обработка транзакции: ${txHash}, сумма: ${amountTon} TON, отправитель: ${senderAddress}`);

      const existingDeposit = await Deposit.findOne({ transactionId: txHash });
      if (existingDeposit) {
        console.log(`Транзакция ${txHash} уже обработана`);
        continue;
      }

      const user = await User.findOne({ tonAddress: senderAddress });
      if (!user) {
        console.log(`Юзер с tonAddress ${senderAddress} не найден`);
        continue;
      }

      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const starsToAdd = Math.floor(amountTon * 100);
        user.balance += starsToAdd;
        user.totalDeposits += starsToAdd;
        await user.save({ session });

        const deposit = new Deposit({
          telegramId: user.telegramId,
          amount: amountTon,
          starsAdded: starsToAdd,
          currency: 'TON',
          transactionId: txHash,
        });
        await deposit.save({ session });

        await session.commitTransaction();
        session.endSession();
        console.log(`Начислено ${starsToAdd} ⭐ для ${user.telegramId} за ${amountTon} TON`);
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Ошибка обработки транзакции:', err);
      }
    }
  } catch (err) {
    console.error('Ошибка получения транзакций:', err.message);
  }
}

// Проверяем каждые 10 секунд
cron.schedule('*/10 * * * * *', processTransactions);

module.exports = { processTransactions };