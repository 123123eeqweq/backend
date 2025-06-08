const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const User = require('../models/User');
const Deposit = require('../models/Deposit');

const WALLET_ADDRESS = 'UQCeRGv6Nf-wnlAKYstkW7UKefuEt8n2dI1u_OOrysYvq8hC';
const TONCENTER_API = 'https://toncenter.com/api/v2/getTransactions';
const API_KEY = process.env.TONCENTER_API_KEY || '';

const userAddressMap = new Map();

async function registerUserAddress(telegramId, tonAddress) {
  userAddressMap.set(telegramId, tonAddress);
  // TODO: Для продакшена сохраняй в базе (например, в User)
}

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

      const existingDeposit = await Deposit.findOne({ transactionId: txHash });
      if (existingDeposit) continue;

      let telegramId = null;
      for (const [id, address] of userAddressMap.entries()) {
        if (address === senderAddress) {
          telegramId = id;
          break;
        }
      }
      if (!telegramId) continue;

      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const user = await User.findOne({ telegramId }).session(session);
        if (!user) {
          await session.abortTransaction();
          session.endSession();
          continue;
        }

        const starsToAdd = Math.floor(amountTon * 100);
        user.balance += starsToAdd;
        user.totalDeposits += starsToAdd;
        await user.save({ session });

        const deposit = new Deposit({
          telegramId,
          amount: amountTon,
          starsAdded: starsToAdd,
          currency: 'TON',
          transactionId: txHash,
        });
        await deposit.save({ session });

        await session.commitTransaction();
        session.endSession();
        console.log(`Начислено ${starsToAdd} ⭐ для ${telegramId} за ${amountTon} TON`);
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Ошибка обработки транзакции:', err);
      }
    }
  } catch (err) {
    console.error('Ошибка получения транзакций:', err);
  }
}

cron.schedule('*/30 * * * * *', processTransactions);

module.exports = { registerUserAddress, processTransactions };