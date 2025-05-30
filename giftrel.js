const mongoose = require('mongoose');
const User = require('./models/User');
const Gift = require('./models/Gift');

// Подключаемся к локальной MongoDB
const mongoURI = 'mongodb://localhost:27017/telegram-roulette';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  distributeGifts();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function distributeGifts() {
  try {
    // Проверяем все подарки в базе
    const allGifts = await Gift.find({});
    console.log('All gifts in database:', allGifts);

    // Находим подарки с ценой до 300
    let eligibleGifts = await Gift.find({ price: { $lte: 300 } });
    console.log(`Found ${eligibleGifts.length} gifts with price <= 300`);

    // Если подходящих подарков нет, создаём хардкодные
    if (eligibleGifts.length < 10) {
      console.log('Not enough gifts with price <= 300, creating hardcoded gifts');
      const hardcodedGifts = [
        { giftId: 'gift1', name: 'Маленький сундучок', image: 'https://via.placeholder.com/100', price: 100 },
        { giftId: 'gift2', name: 'Звёздный кулон', image: 'https://via.placeholder.com/100', price: 150 },
        { giftId: 'gift3', name: 'Светяшка', image: 'https://via.placeholder.com/100', price: 200 },
        { giftId: 'gift4', name: 'Кольцо удачи', image: 'https://via.placeholder.com/100', price: 250 },
        { giftId: 'gift5', name: 'Мини-трофей', image: 'https://via.placeholder.com/100', price: 300 },
        { giftId: 'gift6', name: 'Леденец силы', image: 'https://via.placeholder.com/100', price: 120 },
        { giftId: 'gift7', name: 'Браслет ветра', image: 'https://via.placeholder.com/100', price: 180 },
        { giftId: 'gift8', name: 'Кубок огня', image: 'https://via.placeholder.com/100', price: 220 },
        { giftId: 'gift9', name: 'Амулет тьмы', image: 'https://via.placeholder.com/100', price: 270 },
        { giftId: 'gift10', name: 'Зеркало удачи', image: 'https://via.placeholder.com/100', price: 290 },
      ];

      // Очищаем коллекцию Gift (опционально, можно закомментить, если не хочешь удалять существующие)
      await Gift.deleteMany({});
      // Добавляем хардкодные подарки в базу
      await Gift.insertMany(hardcodedGifts);
      console.log('Hardcoded gifts added to database:', hardcodedGifts);
      eligibleGifts = hardcodedGifts;
    }

    // Находим юзера с telegramId: "123456"
    let user = await User.findOne({ telegramId: '123456' });
    if (!user) {
      console.log('User 123456 not found, creating new user');
      user = new User({
        telegramId: '123456',
        firstName: 'Тест',
        photoUrl: 'https://via.placeholder.com/40',
        inventory: [],
      });
    }

    // Очищаем инвентарь для чистого теста
    user.inventory = [];

    // Выбираем 10 случайных подарков
    const selectedGifts = [];
    const giftPool = [...eligibleGifts];
    for (let i = 0; i < 10 && giftPool.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * giftPool.length);
      const gift = giftPool.splice(randomIndex, 1)[0];
      selectedGifts.push({
        giftId: gift.giftId,
        name: gift.name,
        image: gift.image,
        price: gift.price,
      });
    }

    // Добавляем подарки в инвентарь
    user.inventory.push(...selectedGifts);
    await user.save();
    console.log(`Added ${selectedGifts.length} gifts to user 123456:`, selectedGifts);

    console.log('Gifts distributed successfully!');
  } catch (err) {
    console.error('Error distributing gifts:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}