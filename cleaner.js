const mongoose = require('mongoose');
     const dotenv = require('dotenv');
     const User = require('./models/User'); // Изменил путь, если models в backend

     dotenv.config();

     const connectDB = async () => {
       try {
         await mongoose.connect(process.env.MONGODB_URI, {
           useNewUrlParser: true,
           useUnifiedTopology: true,
         });
         console.log('MongoDB подключена, братан!');
       } catch (error) {
         console.error('MongoDB не хочет дружить:', error.message);
         process.exit(1);
       }
     };

     const cleanNone = async () => {
       await connectDB();
       try {
         const users = await User.find({ 'inventory.giftId': 'gift_001' });
         for (const user of users) {
           user.inventory = user.inventory.filter(item => item.giftId !== 'gift_001');
           await user.save();
           console.log(`Очищен инвентарь юзера ${user.telegramId}`);
         }
         console.log('Очистка gift_001 завершена!');
         mongoose.connection.close();
       } catch (error) {
         console.error('Ошибка при очистке:', error);
         mongoose.connection.close();
       }
     };

     cleanNone();