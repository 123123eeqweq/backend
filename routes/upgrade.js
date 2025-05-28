const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Gift = require('../models/Gift');

router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { giveGiftId, receiveGiftId } = req.body;

  try {
    // Проверяем юзера
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден!' });
    }

    // Проверяем наличие giveGiftId в инвентаре
    const giveItemIndex = user.inventory.findIndex(item => item.giftId === giveGiftId);
    if (giveItemIndex === -1) {
      return res.status(400).json({ message: 'Шмотка для отдачи не найдена в инвентаре!' });
    }

    // Проверяем подарки
    const giveGift = await Gift.findOne({ giftId: giveGiftId });
    const receiveGift = await Gift.findOne({ giftId: receiveGiftId });
    if (!giveGift || !receiveGift) {
      return res.status(400).json({ message: 'Один из подарков не найден!' });
    }

    // Рассчитываем шанс
    const ratio = receiveGift.price / giveGift.price;
    let chance = 45; // Базовый шанс для ratio = 2
    if (ratio > 2) {
      chance = 45 - 10 * (ratio - 2); // Падает на 10% за каждый +1 к ratio
    } else if (ratio < 2) {
      chance = 45 + 20 * (2 - ratio); // Растёт на 20% за каждый -0.5 к ratio
    }
    chance = Math.min(80, Math.max(10, Math.floor(chance)));

    // Проверяем успех
    const random = Math.random() * 100;
    const success = random < chance;

    // Обновляем инвентарь
    user.inventory.splice(giveItemIndex, 1); // Удаляем giveItem
    let result = null;
    if (success) {
      user.inventory.push({
        giftId: receiveGift.giftId,
        name: receiveGift.name,
        image: receiveGift.image,
        price: receiveGift.price,
      });
      result = {
        giftId: receiveGift.giftId,
        name: receiveGift.name,
        image: receiveGift.image,
        price: receiveGift.price,
      };
    }

    await user.save();

    res.json({
      success, 
      result,
      newInventory: user.inventory,
    });
  } catch (error) {
    console.error('Ошибка апгрейда:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;