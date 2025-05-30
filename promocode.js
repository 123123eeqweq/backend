const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PromoCode = require('/models/PromoCode');

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

// Генерация случайного промокода
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Создание промокода
const createPromoCode = async () => {
  try {
    await connectDB();

    // Настраиваемые параметры промокода
    const promoData = {
      code: generateCode(), // Генерируем случайный код
      stars: 1000, // Количество звёздочек (меняй по нужде)
      maxActivations: 5, // Максимум активаций
    };

    // Проверяем, нет ли уже такого кода
    const existingPromo = await PromoCode.findOne({ code: promoData.code });
    if (existingPromo) {
      console.log(`Код ${promoData.code} уже существует, генерируем новый...`);
      promoData.code = generateCode();
    }

    const promoCode = new PromoCode(promoData);
    await promoCode.save();

    console.log(`Промокод создан: ${promoData.code}, звёзды: ${promoData.stars}, активации: ${promoData.maxActivations}`);

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