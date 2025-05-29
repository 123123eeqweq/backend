const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.balance += amount;
    await user.save();

    res.json({
      newBalance: user.balance,
      message: 'Deposit successful',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;