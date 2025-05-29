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

    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID is required' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const caseItem = await Case.findOne({ caseId });
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseId === 'case_13') {
      const now = new Date();
      const lastSpin = user.lastFreeDailySpin;
      if (lastSpin && (now - lastSpin) < 24 * 60 * 60 * 1000) {
        const timeLeft = 24 * 60 * 60 * 1000 - (now - lastSpin);
        return res.status(403).json({
          message: 'Free Daily can only be spun once per day',
          timeLeft: Math.floor(timeLeft / 1000),
        });
      }
    } else if (caseItem.diamondPrice) {
      if (user.diamonds < caseItem.diamondPrice) {
        return res.status(400).json({ message: 'Not enough diamonds' });
      }
      user.diamonds -= caseItem.diamondPrice;
    } else {
      if (user.balance < caseItem.price) {
        return res.status(400).json({ message: 'Not enough stars' });
      }
      user.balance -= caseItem.price;
    }

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

    if (chosenGift.giftId === 'gift_001') {
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
        newDiamonds: user.diamonds,
        message: 'No reward received',
      });
    }

    user.inventory.push({
      giftId: chosenGift.giftId,
      name: chosenGift.name,
      image: chosenGift.image,
      price: chosenGift.price,
    });

    if (caseId === 'case_13') {
      user.lastFreeDailySpin = new Date();
    }

    // Сохраняем спин в ленту
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;