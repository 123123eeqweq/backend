const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { telegramId, firstName, photoUrl, refId } = req.body;

    if (!telegramId || !firstName) {
      return res.status(400).json({ message: 'Telegram ID and firstName are required' });
    }

    let user = await User.findOne({ telegramId });
    if (user) {
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
        user.invitedBy = refId;
        referrer.referrals.push(telegramId);
        referrer.diamonds += 1; // Начисляем 1 алмазик
        await referrer.save();
      }
    }

    await user.save();

    res.json({
      id: user.telegramId,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      diamonds: user.diamonds,
      inventory: user.inventory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;