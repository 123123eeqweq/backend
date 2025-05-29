const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

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

const createTestUser = async () => {
  await connectDB();
  try {
    let user = await User.findOne({ telegramId: '#123456' });
    if (!user) {
      user = new User({
        telegramId: '#123456',
        firstName: 'Тестовый Братан',
        photoUrl: 'https://via.placeholder.com/40',
        balance: 200,
        inventory: [
          {
            giftId: 'gift_002',
            name: 'heart',
            image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183353/2_jvtcjs.png',
            price: 15,
          },
          {
            giftId: 'gift_003',
            name: 'teddy',
            image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183353/4_bcuxgp.png',
            price: 15,
          },
        ],
      });
      await user.save();
      console.log('Тестовый юзер создан, братан!');
    } else {
      console.log('Тестовый юзер уже есть!');
    }
    mongoose.connection.close();
  } catch (error) {
    console.error('Ошибка:', error);
    mongoose.connection.close();
  }
};

createTestUser();