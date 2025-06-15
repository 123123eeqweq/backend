const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env
dotenv.config();

// Импортируем модель User
const User = require('./models/User');

// Подключаемся к MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB подключена');
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  }
};

// Функция добавления баланса и алмазов
const addBalance = async () => {
  try {
    // Подключаемся к базе
    await connectDB();

    const telegramId = '11';
    const balanceToAdd = 5000;
    const diamondsToAdd = 1000;

    // Находим юзера
    const user = await User.findOne({ telegramId });
    if (!user) {
      console.log(`Юзер с telegramId ${telegramId} не найден`);
      await mongoose.connection.close();
      return;
    }

    // Добавляем баланс и алмазы
    user.balance += balanceToAdd;
    user.diamonds += diamondsToAdd;
    await user.save();

    console.log(`Добавлено ${balanceToAdd} звёздочек и ${diamondsToAdd} алмазиков юзеру ${telegramId}. Новый баланс: ${user.balance}, алмазы: ${user.diamonds}`);

    // Закрываем соединение
    await mongoose.connection.close();
    console.log('Соединение с MongoDB закрыто');
  } catch (error) {
    console.error('Ошибка при добавлении баланса:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Запускаем
addBalance();