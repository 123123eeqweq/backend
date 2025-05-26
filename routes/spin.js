const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const User = require('../models/User');

// Эндпоинт для спина кейса
router.post('/:caseId', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const { caseId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID нужен, братан!' });
    }

    // Находим юзера
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    // Находим кейс
    const caseItem = await Case.findOne({ caseId });
    if (!caseItem) {
      return res.status(404).json({ message: 'Кейс не найден, братан!' });
    }

    // Проверка для Free Daily (case_13)
    if (caseId === 'case_13') {
      const now = new Date();
      const lastSpin = user.lastFreeDailySpin;
      if (lastSpin && (now - lastSpin) < 24 * 60 * 60 * 1000) {
        const timeLeft = 24 * 60 * 60 * 1000 - (now - lastSpin);
        return res.status(403).json({
          message: 'Брат, Free Daily можно крутить раз в день!',
          timeLeft: Math.floor(timeLeft / 1000),
        });
      }
    } else {
      // Проверяем баланс для платных кейсов
      if (user.balance < caseItem.price) {
        return res.status(400).json({ message: 'Не хватает звёзд, братан!' });
      }
      user.balance -= caseItem.price;
    }

    // Взвешенный рандом
    const rand = Math.random();
    let cumulativeProbability = 0;
    let chosenGift = null;
    for (const item of caseItem.items) {
      cumulativeProbability += item.probability;
      if (rand < cumulativeProbability) {
        const gift = await Gift.findOne({ giftId: item.giftId });
        chosenGift = gift;
        break;
      }
    }
    if (!chosenGift) {
      chosenGift = await Gift.findOne({ giftId: caseItem.items[caseItem.items.length - 1].giftId });
    }

    // Пропускаем gift_001 (none)
    if (chosenGift.giftId === 'gift_001') {
      // Если Free Daily, обновляем lastFreeDailySpin, но не добавляем в инвентарь
      if (caseId === 'case_13') {
        user.lastFreeDailySpin = new Date();
        await user.save();
      }
      return res.json({
        gift: {
          id: chosenGift.giftId,
          name: chosenGift.name,
          image: chosenGift.image,
          price: chosenGift.price,
        },
        newBalance: user.balance,
        message: 'Ничего не выпало, братан!',
      });
    }

    // Обновляем инвентарь
    user.inventory.push({
      giftId: chosenGift.giftId,
      name: chosenGift.name,
      image: chosenGift.image,
      price: chosenGift.price,
    });

    // Если Free Daily, обновляем lastFreeDailySpin
    if (caseId === 'case_13') {
      user.lastFreeDailySpin = new Date();
    }

    await user.save();

    // Возвращаем результат спина
    res.json({
      gift: {
        id: chosenGift.giftId,
        name: chosenGift.name,
        image: chosenGift.image,
        price: chosenGift.price,
      },
      newBalance: user.balance,
    });
  } catch (error) {
    console.error('Ошибка при спине:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;