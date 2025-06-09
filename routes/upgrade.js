const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Gift = require('../models/Gift');

router.post('/:telegramId', async (req, res) => {
  const { giveGiftId, receiveGiftId } = req.body;
  const { telegramId } = req.params;

  if (!giveGiftId || !receiveGiftId) {
    return res.status(400).json({ message: 'Требуются giveGiftId и receiveGiftId' });
  }

  try {
    // Находим пользователя
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, есть ли giveGiftId в инвентаре
    const giveItemIndex = user.inventory.findIndex(item => item.giftId === giveGiftId);
    if (giveItemIndex === -1) {
      return res.status(400).json({ message: 'Подарок не найден в инвентаре' });
    }

    // Находим подарки
    const giveGift = await Gift.findOne({ giftId: giveGiftId });
    const receiveGift = await Gift.findOne({ giftId: receiveGiftId });
    if (!giveGift || !receiveGift) {
      return res.status(404).json({ message: 'Подарок не найден' });
    }

    // Проверяем, что receiveGift дороже
    if (receiveGift.price <= giveGift.price) {
      return res.status(400).json({ message: 'Выберите подарок с большей стоимостью' });
    }

    // Вычисляем шанс успеха
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

    // Удаляем giveGift из инвентаря
    user.inventory.splice(giveItemIndex, 1);

    let result = null;
    if (success) {
      // Добавляем receiveGift в инвентарь
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
      chance, // Возвращаем шанс для фронта
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;