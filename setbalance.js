const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Подключаем модель User

dotenv.config();

// Подключаемся к MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB подключена, братан!'))
  .catch(err => {
    console.error('MongoDB ошибка:', err);
    process.exit(1);
  });

const setBalance = async () => {
  try {
    const telegramId = '123456';
    const balance = 100000; // 100к звёздочек

    // Находим или создаём юзера и обновляем баланс
    const user = await User.findOneAndUpdate(
      { telegramId },
      { balance },
      { new: true, upsert: true }
    );

    console.log(`Баланс для telegramId: ${telegramId} обновлён! Новый баланс: ${user.balance} звёздочек`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Ошибка при начислении баланса:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

setBalance();