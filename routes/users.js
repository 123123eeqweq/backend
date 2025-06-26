const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

// Проверка авторизации
router.use((req, res, next) => {
  const telegramId = req.headers.authorization?.split(' ')[1]; // Ожидаем "Bearer <telegramId>"
  if (!telegramId) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  next();
});

router.get('/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({
      telegramId: user.telegramId,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      diamonds: user.diamonds,
      inventory: user.inventory,
      totalDeposits: user.totalDeposits,
      openedTopupCases: user.openedTopupCases,
      hasInitiatedFirstWithdrawal: user.hasInitiatedFirstWithdrawal,
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

router.post('/add-balance', async (req, res) => {
  const { telegramId, amount, type = 'stars' } = req.body;

  if (!telegramId || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Некорректные данные' });
  }
  if (!['stars', 'diamonds'].includes(type)) {
    return res.status(400).json({ message: 'Тип должен быть stars или diamonds' });
  }

  try {
    const update = type === 'diamonds' ? { diamonds: amount } : { balance: amount };
    const user = await User.findOneAndUpdate(
      { telegramId },
      { $inc: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: `Начислено ${amount} ${type} пользователю ${telegramId}` });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

router.post('/add-balance/remove', async (req, res) => {
  const { telegramId, amount, type = 'stars' } = req.body;

  if (!telegramId || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Некорректные данные' });
  }
  if (!['stars', 'diamonds'].includes(type)) {
    return res.status(400).json({ message: 'Тип должен быть stars или diamonds' });
  }

  try {
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const currentBalance = type === 'diamonds' ? user.diamonds : user.balance;
    if (currentBalance < amount) {
      return res.status(400).json({ message: `Недостаточно ${type} для снятия` });
    }

    const update = type === 'diamonds' ? { diamonds: -amount } : { balance: -amount };
    const updatedUser = await User.findOneAndUpdate(
      { telegramId },
      { $inc: update },
      { new: true }
    );

    res.json({ message: `Снято ${amount} ${type} у пользователя ${telegramId}` });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

router.post('/initiate-withdrawal/:telegramId', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { telegramId: req.params.telegramId },
      { $set: { hasInitiatedFirstWithdrawal: true } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ message: 'Первый вывод инициирован', hasInitiatedFirstWithdrawal: true });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

router.get('/withdraw/:telegramId/:giftId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const giftIndex = user.inventory.findIndex((item) => item.giftId === req.params.giftId);
    if (giftIndex === -1) {
      return res.status(400).json({ message: 'Подарок не найден в инвентаре' });
    }

    const gift = user.inventory[giftIndex];
    user.inventory.splice(giftIndex, 1);
    await user.save();

    // Проверка переменных окружения
    if (!botToken || adminIds.length === 0) {
      // Логирование пропущено для продакшна, так как это не критично
    } else {
      // Отправка уведомления админам
      const message = `Пользователь #${req.params.telegramId} вывел подарок "${gift.name}" (${req.params.giftId}) за ${gift.price} звёзд\nСсылка: https://t.me/@id${req.params.telegramId}`;
      for (const adminId of adminIds) {
        try {
          await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: adminId,
            text: message,
          });
        } catch (error) {
          // Ошибка отправки уведомления не влияет на основной процесс
        }
      }
    }

    res.json({
      message: 'Подарок выведен',
      inventory: user.inventory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;