const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      referralLink: `t.me/testerywieyr4343_bot?start=ref_${telegramId}`,
      invitedCount: user.referrals.length,
      diamonds: user.diamonds,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;