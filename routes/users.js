const express = require('express');
     const router = express.Router();
     const User = require('../models/User');

     // Получение данных юзера
     router.get('/:telegramId', async (req, res) => {
       try {
         console.log(`Fetching user with telegramId: ${req.params.telegramId}`);
         const user = await User.findOne({ telegramId: req.params.telegramId });
         if (!user) {
           console.log(`User not found: ${req.params.telegramId}`);
           return res.status(404).json({ message: 'User not found' });
         }
         res.json({
           telegramId: user.telegramId,
           firstName: user.firstName,
           photoUrl: user.photoUrl,
           balance: user.balance,
           diamonds: user.diamonds,
           inventory: user.inventory,
           totalDeposits: user.totalDeposits,
           openedTopupCases: user.openedTopupCases,
           hasInitiatedFirstWithdrawal: user.hasInitiatedFirstWithdrawal,
         });
       } catch (error) {
         console.error(`Error fetching user: ${error.message}`);
         res.status(500).json({ message: 'Server error' });
       }
     });

     // Начисление баланса
     router.post('/add-balance', async (req, res) => {
       const { telegramId, amount, type = 'stars' } = req.body;

       console.log(`Adding balance: ${amount} ${type} for telegramId: ${telegramId}`);
       // Валидация
       if (!telegramId || !Number.isInteger(amount) || amount <= 0) {
         console.log('Invalid data for add-balance');
         return res.status(400).json({ message: 'Некорректные данные' });
       }
       if (!['stars', 'diamonds'].includes(type)) {
         console.log(`Invalid type: ${type}`);
         return res.status(400).json({ message: 'Тип должен быть stars или diamonds' });
       }

       try {
         const update = type === 'diamonds' ? { diamonds: amount } : { balance: amount };
         const user = await User.findOneAndUpdate(
           { telegramId },
           { $inc: update },
           { new: true }
         );

         if (!user) {
           console.log(`User not found: ${telegramId}`);
           return res.status(404).json({ message: 'Юзер не найден' });
         }

         res.json({ message: `Начислено ${amount} ${type} юзеру ${telegramId}` });
       } catch (error) {
         console.error(`Error adding balance: ${error.message}`);
         res.status(500).json({ message: 'Ошибка сервера' });
       }
     });

     // Снятие баланса
     router.post('/add-balance/remove', async (req, res) => {
       const { telegramId, amount, type = 'stars' } = req.body;

       console.log(`Removing balance: ${amount} ${type} for telegramId: ${telegramId}`);
       // Валидация
       if (!telegramId || !Number.isInteger(amount) || amount <= 0) {
         console.log('Invalid data for remove-balance');
         return res.status(400).json({ message: 'Некорректные данные' });
       }
       if (!['stars', 'diamonds'].includes(type)) {
         console.log(`Invalid type: ${type}`);
         return res.status(400).json({ message: 'Тип должен быть stars или diamonds' });
       }

       try {
         // Проверяем, достаточно ли баланса
         const user = await User.findOne({ telegramId });
         if (!user) {
           console.log(`User not found: ${telegramId}`);
           return res.status(404).json({ message: 'Юзер не найден' });
         }

         const currentBalance = type === 'diamonds' ? user.diamonds : user.balance;
         if (currentBalance < amount) {
           console.log(`Insufficient ${type}: ${currentBalance} < ${amount}`);
           return res.status(400).json({ message: `Недостаточно ${type} для снятия` });
         }

         // Уменьшаем баланс
         const update = type === 'diamonds' ? { diamonds: -amount } : { balance: -amount };
         const updatedUser = await User.findOneAndUpdate(
           { telegramId },
           { $inc: update },
           { new: true }
         );

         res.json({ message: `Снято ${amount} ${type} у юзера ${telegramId}` });
       } catch (error) {
         console.error(`Error removing balance: ${error.message}`);
         res.status(500).json({ message: 'Ошибка сервера' });
       }
     });

     // Отметка первого вывода
     router.post('/initiate-withdrawal/:telegramId', async (req, res) => {
       try {
         console.log(`Initiating first withdrawal for telegramId: ${req.params.telegramId}`);
         const user = await User.findOneAndUpdate(
           { telegramId: req.params.telegramId },
           { $set: { hasInitiatedFirstWithdrawal: true } },
           { new: true }
         );
         if (!user) {
           console.log(`User not found: ${req.params.telegramId}`);
           return res.status(404).json({ message: 'Юзер не найден' });
         }
         res.json({ message: 'Первый вывод инициирован', hasInitiatedFirstWithdrawal: true });
       } catch (error) {
         console.error(`Error initiating withdrawal: ${error.message}`);
         res.status(500).json({ message: 'Ошибка сервера' });
       }
     });

     // Удаление подарка из инвентаря (вывод)
     router.post('/withdraw/:telegramId/:giftId', async (req, res) => {
       try {
         console.log(`Withdrawing gift ${req.params.giftId} for telegramId: ${req.params.telegramId}`);
         const user = await User.findOne({ telegramId: req.params.telegramId });
         if (!user) {
           console.log(`User not found: ${req.params.telegramId}`);
           return res.status(404).json({ message: 'Юзер не найден' });
         }

         const giftIndex = user.inventory.findIndex((item) => item.giftId === req.params.giftId);
         if (giftIndex === -1) {
           console.log(`Gift not found: ${req.params.giftId} in inventory`);
           return res.status(400).json({ message: 'Подарок не найден в инвентаре' });
         }

         user.inventory.splice(giftIndex, 1);
         await user.save();
         console.log(`Gift ${req.params.giftId} withdrawn, new inventory:`, user.inventory);

         res.json({
           message: 'Подарок выведен',
           inventory: user.inventory,
         });
       } catch (error) {
         console.error(`Error withdrawing gift: ${error.message}`);
         res.status(500).json({ message: 'Ошибка сервера' });
       }
     });

     module.exports = router;