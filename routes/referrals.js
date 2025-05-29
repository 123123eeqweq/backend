const express = require('express');
   const router = express.Router();
   const User = require('../models/User');

   router.get('/:telegramId', async (req, res) => {
     try {
       const { telegramId } = req.params;
       const user = await User.findOne({ telegramId });
       if (!user) {
         return res.status(404).json({ message: 'Пользователь не найден' });
       }

       res.json({
         referralLink: `https://t.me/${process.env.BOT_USERNAME}/${process.env.WEB_APP_NAME}?start=ref_${telegramId}`,
         invitedCount: user.referrals.length,
         diamonds: user.diamonds,
       });
     } catch (error) {
       res.status(500).json({ message: 'Ошибка сервера' });
     }
   });

   module.exports = router;