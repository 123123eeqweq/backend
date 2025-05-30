const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PromoCode = require('./models/PromoCoder');

// Загружаем переменные окружения
dotenv.config();

// Подключаемся к MongoDB
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

// Функция создания промокода
const createPromoCode = async () => {
  try {
    await connectDB();

    // Настройки промокода (меняй тут)
    const promoData = {
      code: 'LETO2025', // Задавай свой код тут
      stars: 1000, // Количество звёзд за активацию
      maxActivations: 4, // Максимум активаций
    };

    // Валидация кода
    if (!promoData.code || promoData.code.length < 4) {
      console.error('Код должен быть длиной минимум 4 символа');
      await mongoose.connection.close();
      return;
    }

    // Проверяем, не существует ли уже такой код
    const existingPromo = await PromoCode.findOne({ code: promoData.code });
    if (existingPromo) {
      console.error(`Промокод ${promoData.code} уже существует!`);
      await mongoose.connection.close();
      return;
    }

    const promoCode = new PromoCode(promoData);
    await promoCode.save();

    console.log(`Промокод создан: ${promoCode.code}, звёзды: ${promoCode.stars}, активации: ${promoCode.maxActivations}`);
    
    await mongoose.connection.close();
    console.log('База закрыта, всё ок!');
  } catch (error) {
    console.error('Ошибка при создании промокода:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Запускаем
createPromoCode();