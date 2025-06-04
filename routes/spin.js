const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const User = require('../models/User');
const LiveSpin = require('../models/LiveSpin');

router.post('/:caseId', async (req, res) => {
  try {
    const { telegramId, isDemo } = req.body;
    const { caseId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ message: 'Требуется Telegram ID, братан!' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден!' });
    }

    const caseItem = await Case.findOne({ caseId });
    if (!caseItem || !caseItem.items || caseItem.items.length === 0) {
      return res.status(404).json({ message: 'Кейс не найден или пустой!' });
    }

    // Проверка баланса (только для не-демо режима)
    if (!isDemo) {
      if (caseId === 'case_13') {
        const now = new Date();
        const lastSpin = user.lastFreeDailySpin;
        if (lastSpin && now - lastSpin < 24 * 60 * 60 * 1000) {
          const timeLeft = 24 * 60 * 60 * 1000 - (now - lastSpin);
          return res.status(403).json({
            message: `Бесплатный спин доступен через ${Math.floor(timeLeft / 3600000)}ч ${Math.floor((timeLeft % 3600000) / 60000)}м`,
          });
        }
      } else if (caseItem.isTopup) {
        const requiredDeposits = parseInt(caseItem.name.match(/\d+/)[0]);
        if (user.totalDeposits < requiredDeposits) {
          return res.status(403).json({
            message: `Недостаточно депозитов! Нужно ${requiredDeposits} ⭐, у тебя ${user.totalDeposits} ⭐`,
          });
        }
        if (user.openedTopupCases.includes(caseId)) {
          return res.status(403).json({ message: 'Этот кейс уже открыт, братан!' });
        }
      } else if (caseItem.isReferral && caseItem.diamondPrice > 0) {
        if (user.diamonds < caseItem.diamondPrice) {
          return res.status(400).json({ message: `Недостаточно алмазов! Нужно ${caseItem.diamondPrice}, у тебя ${user.diamonds}` });
        }
        user.diamonds -= caseItem.diamondPrice;
      } else if (caseItem.price > 0) {
        if (user.balance < caseItem.price) {
          return res.status(400).json({ message: `Недостаточно звёзд! Нужно ${caseItem.price}, у тебя ${user.balance}` });
        }
        user.balance -= caseItem.price;
      }
    }

    // Выбор подарка
    const rand = Math.random();
    let cumulativeProbability = 0;
    let chosenGift = null;
    let chosenProbability = 0;
    let chosenIndex = 0;
    for (let i = 0; i < caseItem.items.length; i++) {
      const item = caseItem.items[i];
      cumulativeProbability += item.probability;
      if (rand <= cumulativeProbability) {
        chosenGift = await Gift.findOne({ giftId: item.giftId });
        chosenProbability = item.probability;
        chosenIndex = i;
        break;
      }
    }
    if (!chosenGift) {
      chosenGift = await Gift.findOne({ giftId: caseItem.items[caseItem.items.length - 1].giftId });
      chosenProbability = caseItem.items[caseItem.items.length - 1].probability;
      chosenIndex = caseItem.items.length - 1;
    }

    // Определяем позицию в ленте
    const tapePosition = Math.floor(50 * 0.75) + chosenIndex % 5;

    // Обновление юзера (только для не-демо режима)
    if (!isDemo) {
      if (chosenGift.giftId !== 'gift_001') {
        user.inventory.push({
          giftId: chosenGift.giftId,
          name: chosenGift.name,
          image: chosenGift.image,
          price: chosenGift.price,
        });
      }
      if (caseId === 'case_13') {
        user.lastFreeDailySpin = new Date();
      }
      if (caseItem.isTopup) {
        user.openedTopupCases.push(caseId);
      }
      await user.save();

      // Логирование спина
      const liveSpin = new LiveSpin({
        giftId: chosenGift.giftId,
        caseId: caseItem.caseId,
      });
      await liveSpin.save();
    }

    res.json({
      gift: {
        giftId: chosenGift.giftId,
        name: chosenGift.name,
        image: chosenGift.image,
        price: chosenGift.price,
      },
      probability: chosenProbability,
      tapePosition,
      newBalance: isDemo ? user.balance : user.balance,
      newDiamonds: isDemo ? user.diamonds : user.diamonds,
    });
  } catch (error) {
    console.error('Spin error:', error.message);
    res.status(500).json({ message: error.message || 'Сервак упал, сорян!' });
  }
});

module.exports = router;