const express = require('express');
const router = express.Router();
const Gift = require('../models/Gift');

// Эндпоинт для получения всех подарков
router.get('/', async (req, res) => {
  try {
    const gifts = await Gift.find();
    const formattedGifts = gifts.map(gift => ({
      id: gift.giftId,
      name: gift.name,
      image: gift.image,
      price: gift.price,
    }));
    res.json(formattedGifts);
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;