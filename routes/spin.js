const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const User = require('../models/User');
const LiveSpin = require('../models/LiveSpin');

router.post('/:caseId', async (req, res) => {
  try {
    const { telegramId, isDemo, isHunterCase } = req.body;
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

    // Проверка на демо-режим для Free Daily, реферальных и кейсов за депозиты
    if (isDemo && (caseId === 'case_13' || caseItem.isReferral || caseItem.isTopup)) {
      return res.status(403).json({ message: 'Демо-режим недоступен для этого кейса, братан!' });
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

    let chosenGift = null;
    let chosenProbability = 0;
    let chosenIndex = 0;

    if (isHunterCase) {
      // Для хантер-кейсов всегда возвращаем gift_001
      chosenGift = await Gift.findOne({ giftId: 'gift_001' });
      chosenProbability = 1;
      chosenIndex = caseItem.items.findIndex(item => item.giftId === 'gift_001');
    } else {
      // Обычная логика выбора подарка
      const rand = Math.random();
      let cumulativeProbability = 0;
      for (let i = 0; i < caseItem.items.length; i++) {
        const item = caseItem.items[i];
        // Пропускаем gift_037 (plushpepe)
        if (item.giftId === 'gift_037') continue;
        cumulativeProbability += item.probability;
        if (rand <= cumulativeProbability) {
          chosenGift = await Gift.findOne({ giftId: item.giftId });
          chosenProbability = item.probability;
          chosenIndex = i;
          break;
        }
      }
      // Fallback: выбираем первый подарок с ненулевой вероятностью, кроме gift_037
      if (!chosenGift) {
        const validItems = caseItem.items.filter(item => item.probability > 0 && item.giftId !== 'gift_037');
        if (validItems.length === 0) {
          // Если нет валидных подарков, возвращаем gift_001
          chosenGift = await Gift.findOne({ giftId: 'gift_001' });
          chosenProbability = 1;
          chosenIndex = caseItem.items.findIndex(item => item.giftId === 'gift_001');
        } else {
          const fallbackItem = validItems[0];
          chosenGift = await Gift.findOne({ giftId: fallbackItem.giftId });
          chosenProbability = fallbackItem.probability;
          chosenIndex = caseItem.items.findIndex(item => item.giftId === fallbackItem.giftId);
        }
      }
    }

    // Дополнительная защита: если случайно выбрался gift_037, заменяем на gift_001
    if (chosenGift.giftId === 'gift_037') {
      console.log(`Warning: gift_037 was selected for case ${caseId}, forcing gift_001`);
      chosenGift = await Gift.findOne({ giftId: 'gift_001' });
      chosenProbability = 1;
      chosenIndex = caseItem.items.findIndex(item => item.giftId === 'gift_001');
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