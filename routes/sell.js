const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Gift = require('../models/Gift');

// Эндпоинт для продажи подарка
router.post('/:telegramId/:giftId', async (req, res) => {
  try {
    const { telegramId, giftId } = req.params;

    // Находим юзера
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден, братан!' });
    }

    // Проверяем, есть ли подарок в инвентаре
    const inventoryItemIndex = user.inventory.findIndex(item => item.giftId === giftId);
    if (inventoryItemIndex === -1) {
      return res.status(400).json({ message: 'Подарок не в инвентаре, братан!' });
    }

    // Находим подарок
    const gift = await Gift.findOne({ giftId });
    if (!gift) {
      return res.status(404).json({ message: 'Подарок не найден, братан!' });
    }

    // Обновляем баланс и удаляем подарок
    user.balance += gift.price;
    user.inventory.splice(inventoryItemIndex, 1);
    await user.save();

    res.json({
      message: 'Подарок продан, звёзды на балансе!',
      newBalance: user.balance,
      inventory: user.inventory,
    });
  } catch (error) {
    console.error('Ошибка при продаже:', error);
    res.status(500).json({ message: 'Сервак упал, сорян!' });
  }
});

module.exports = router;