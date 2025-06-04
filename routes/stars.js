const express = require('express');
const router = express.Router();
const { Telegraf } = require('telegraf');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const mongoose = require('mongoose');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Создание инвойса
router.post('/create-invoice', async (req, res) => {
  try {
    const { telegramId, starsAmount } = req.body;

    if (!telegramId || !starsAmount || starsAmount <= 0) {
      return res.status(400).json({ message: 'Некорректные данные, братан!' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    // Создаём инвойс через Bot API
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: 'Пополнение звёздочек',
      description: `Покупка ${starsAmount} Telegram Stars для рулетки`,
      payload: JSON.stringify({ telegramId, starsAmount }),
      provider_token: '', // Пустой для Telegram Stars
      currency: 'XTR', // Код валюты для Telegram Stars
      prices: [{ label: 'Звёздочки', amount: starsAmount }],
    });

    res.json({ invoiceLink });
  } catch (error) {
    console.error('Ошибка создания инвойса:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

// Вебхук для обработки транзакций Telegram Stars
router.post('/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Ошибка вебхука:', error);
    res.sendStatus(500);
  }
});

// Обработка pre_checkout_query
bot.on('pre_checkout_query', async (ctx) => {
  try {
    await ctx.answerPreCheckoutQuery(true);
  } catch (error) {
    console.error('Ошибка pre_checkout_query:', error);
    await ctx.answerPreCheckoutQuery(false, 'Ошибка обработки, попробуй позже!');
  }
});

// Обработка успешной оплаты
bot.on('successful_payment', async (ctx) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoice_payload, telegram_payment_charge_id, total_amount } = ctx.update.message.successful_payment;
    const { telegramId, starsAmount } = JSON.parse(invoice_payload);

    const user = await User.findOne({ telegramId }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return ctx.reply('Юзер не найден, братан!');
    }

    const starsToAdd = Math.floor(starsAmount);
    user.balance += starsToAdd;
    user.totalDeposits += starsToAdd; // Добавляем к totalDeposits
    await user.save({ session });

    const deposit = new Deposit({
      telegramId,
      amount: starsAmount,
      starsAdded: starsToAdd,
      currency: 'STARS',
      transactionId: telegram_payment_charge_id,
    });
    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    await ctx.reply(`Начислено ${starsToAdd} ⭐ за ${starsAmount} Telegram Stars!`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Ошибка successful_payment:', error);
    await ctx.reply('Ошибка начисления, напиши админу!');
  }
});

module.exports = router;