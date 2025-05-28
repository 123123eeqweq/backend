const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const giftRoutes = require('./routes/gifts');
const spinRoutes = require('./routes/spin');
const userRoutes = require('./routes/users');
const sellRoutes = require('./routes/sell');
const upgradeRoutes = require('./routes/upgrade');
const freeDailyRoutes = require('./routes/free-daily');
const liveSpinsRoutes = require('./routes/live-spins');
const referralsRoutes = require('./routes/referrals');
const depositRoutes = require('./routes/deposit');
const Case = require('./models/Case');
const Gift = require('./models/Gift');
const LiveSpin = require('./models/LiveSpin');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
connectDB();

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/spin', spinRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/free-daily', freeDailyRoutes);
app.use('/api/live-spins', liveSpinsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/deposit', depositRoutes);

// Тестовый эндпоинт
app.get('/', (req, res) => {
  res.json({ message: 'Йо, бэк для рулетки жив!' });
});

// Фоновая задача для генерации спинов
const generateLiveSpin = async () => {
  try {
    // Получаем все подарки из MongoDB
    const gifts = await Gift.find().lean();

    // Фильтруем gift_001 (none)
    const validGifts = gifts.filter(gift => gift.giftId !== 'gift_001');
    if (validGifts.length === 0) {
      console.error('Нет доступных подарков для ленты!');
      setTimeout(generateLiveSpin, 3000);
      return;
    }

    // Рассчитываем веса: обратная пропорция цены
    const weights = validGifts.map(gift => {
      const price = gift.price || 1; // Избегаем деления на 0
      return 1 / (price / 1000 + 1); // Делим на 1000 для нормализации
    });

    // Нормализуем веса в вероятности
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const probabilities = weights.map(weight => weight / totalWeight);

    // Выбираем случайный подарок
    let rand = Math.random();
    let cumProb = 0;
    let selectedGift = validGifts[0];
    for (let i = 0; i < validGifts.length; i++) {
      cumProb += probabilities[i];
      if (rand <= cumProb) {
        selectedGift = validGifts[i];
        break;
      }
    }

    // Сохраняем спин
    const liveSpin = new LiveSpin({
      giftId: selectedGift.giftId,
      caseId: 'fake_case', // Без привязки к кейсу
    });
    await liveSpin.save();

    // Формируем данные для спина
    const spinData = {
      id: liveSpin._id,
      giftId: liveSpin.giftId,
      caseId: liveSpin.caseId,
      createdAt: liveSpin.createdAt,
      gift: {
        name: selectedGift.name,
        image: selectedGift.image,
        price: selectedGift.price,
      },
    };

    // Отправляем спин всем клиентам
    io.emit('newLiveSpin', spinData);

    // Удаляем старые спины (храним последние 100)
    const spinCount = await LiveSpin.countDocuments();
    if (spinCount > 100) {
      const oldestSpins = await LiveSpin.find()
        .sort({ createdAt: 1 })
        .limit(spinCount - 100);
      await LiveSpin.deleteMany({ _id: { $in: oldestSpins.map(s => s._id) } });
    }

    // Планируем следующий спин (3–8 сек)
    const delay = Math.floor(Math.random() * 5000) + 3000; // 3000–8000 мс
    setTimeout(generateLiveSpin, delay);
  } catch (error) {
    console.error('Ошибка при генерации спина:', error);
    // Перезапускаем через 3 секунды
    setTimeout(generateLiveSpin, 3000);
  }
};

// Запускаем генерацию спинов
generateLiveSpin();

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервак пашет на порту ${PORT}, братан!`);
});