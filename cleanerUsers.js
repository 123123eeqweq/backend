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

// Функция очистки пользователей
const cleanUsers = async () => {
  try {
    // Подключаемся к базе
    await connectDB();

    // Удаляем всех пользователей
    const result = await User.deleteMany({});
    console.log(`Удалено пользователей: ${result.deletedCount}`);

    // Закрываем соединение
    await mongoose.connection.close();
    console.log('Соединение с MongoDB закрыто');
  } catch (error) {
    console.error('Ошибка при очистке пользователей:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Запускаем очистку
cleanUsers();