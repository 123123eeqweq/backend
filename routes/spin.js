const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const User = require('../models/User');
const LiveSpin = require('../models/LiveSpin');

router.post('/:caseId', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const { caseId } = req.params;

    // Валидация
    if (!telegramId) {
      return res.status(400).json({ message: 'Требуется Telegram ID' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const caseItem = await Case.findOne({ caseId });
    if (!caseItem || !caseItem.items || caseItem.items.length === 0) {
      return res.status(404).json({ message: 'Кейс не найден или пустой' });
    }

    // Проверка баланса
    if (caseId === 'case_13') {
      const now = new Date();
      const lastSpin = user.lastFreeDailySpin;
      if (lastSpin && (now - lastSpin) < 24 * 60 * 60 * 1000) {
        const timeLeft = 24 * 60 * 60 * 1000 - (now - lastSpin);
        return res.status(403).json({
          message: 'Бесплатный спин доступен раз в день',
          timeLeft: Math.floor(timeLeft / 1000),
        });
      }
    } else if (caseItem.diamondPrice && caseItem.diamondPrice > 0) {
      if (user.diamonds < caseItem.diamondPrice) {
        return res.status(400).json({ message: 'Недостаточно алмазов' });
      }
      user.diamonds -= caseItem.diamondPrice;
    } else {
      if (user.balance < caseItem.price) {
        return res.status(400).json({ message: 'Недостаточно звёзд' });
      }
      user.balance -= caseItem.price;
    }

    // Выбор подарка
    const rand = Math.random();
    let cumulativeProbability = 0;
    let chosenGift = null;
    for (const item of caseItem.items) {
      cumulativeProbability += item.probability;
      if (rand <= cumulativeProbability) {
        chosenGift = await Gift.findOne({ giftId: item.giftId });
        break;
      }
    }
    if (!chosenGift) {
      chosenGift = await Gift.findOne({ giftId: caseItem.items[caseItem.items.length - 1].giftId });
    }

    // Логирование для отладки
    console.log(`Spin: user=${telegramId}, case=${caseId}, gift=${chosenGift.giftId}`);

    // Обработка результата
    if (chosenGift.giftId === 'gift_001') {
      if (caseId === 'case_13') {
        user.lastFreeDailySpin = new Date();
      }
      await user.save();
      return res.json({
        gift: {
          id: chosenGift.giftId,
          name: chosenGift.name,
          image: chosenGift.image,
          price: chosenGift.price,
        },
        newBalance: user.balance,
        newDiamonds: user.diamonds,
        message: 'Награда не получена',
      });
    }

    // Добавление в инвентарь
    user.inventory.push({
      giftId: chosenGift.giftId,
      name: chosenGift.name,
      image: chosenGift.image,
      price: chosenGift.price,
    });

    if (caseId === 'case_13') {
      user.lastFreeDailySpin = new Date();
    }

    // Сохранение спина
    const liveSpin = new LiveSpin({
      giftId: chosenGift.giftId,
      caseId: caseItem.caseId,
    });
    await liveSpin.save();
    await user.save();

    res.json({
      gift: {
        id: chosenGift.giftId,
        name: chosenGift.name,
        image: chosenGift.image,
        price: chosenGift.price,
      },
      newBalance: user.balance,
      newDiamonds: user.diamonds,
    });
  } catch (error) {
    console.error(`Spin error: ${error.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;