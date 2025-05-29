const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { telegramId, firstName, photoUrl, refId } = req.body;
    console.log('Auth request:', { telegramId, firstName, refId }); // Отладка

    if (!telegramId || !firstName) {
      return res.status(400).json({ message: 'Требуются Telegram ID и имя' });
    }

    let user = await User.findOne({ telegramId });
    if (user) {
      console.log('User already exists:', telegramId); // Отладка
      return res.json({
        id: user.telegramId,
        firstName: user.firstName,
        photoUrl: user.photoUrl,
        balance: user.balance,
        diamonds: user.diamonds,
        inventory: user.inventory,
      });
    }

    user = new User({
      telegramId,
      firstName,
      photoUrl: photoUrl || 'https://via.placeholder.com/40',
      balance: 10000,
      diamonds: 0,
      inventory: [],
    });

    if (refId) {
      const referrer = await User.findOne({ telegramId: refId });
      if (referrer && refId !== telegramId) {
        console.log('Found referrer:', refId); // Отладка
        user.invitedBy = refId;
        referrer.referrals.push(telegramId);
        referrer.diamonds += 1;
        await referrer.save();
        console.log('Referrer updated:', { referrals: referrer.referrals, diamonds: referrer.diamonds }); // Отладка
      } else {
        console.log('Referrer not found or same as user:', { refId, telegramId }); // Отладка
      }
    } else {
      console.log('No refId provided'); // Отладка
    }

    await user.save();
    console.log('New user created:', telegramId); // Отладка

    res.json({
      id: user.telegramId,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      diamonds: user.diamonds,
      inventory: user.inventory,
    });
  } catch (error) {
    console.error('Auth error:', error); // Отладка
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;