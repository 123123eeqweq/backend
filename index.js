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
    const cases = await Case.find().lean();

    // Веса для кейсов (дешёвые чаще, дорогие реже)
    const caseWeights = cases.map(c => {
      if (c.price === 0) return 0.1; // Free Daily и Topup реже
      if (c.price <= 100) return 0.5; // Дешёвые
      if (c.price <= 1000) return 0.3; // Средние
      return 0.1; // Дорогие
    });
    const totalWeight = caseWeights.reduce((a, b) => a + b, 0);
    const caseProbs = caseWeights.map(w => w / totalWeight);

    // Выбираем кейс
    let rand = Math.random();
    let caseIndex = 0;
    let cumProb = 0;
    for (let i = 0; i < caseProbs.length; i++) {
      cumProb += caseProbs[i];
      if (rand < cumProb) {
        caseIndex = i;
        break;
      }
    }
    const selectedCase = cases[caseIndex];

    // Выбираем подарок из кейса (исключаем gift_001)
    const validItems = selectedCase.items.filter(item => item.giftId !== 'gift_001');
    if (validItems.length === 0) return; // Пропускаем, если только none

    const totalProb = validItems.reduce((sum, item) => sum + item.probability, 0);
    const normalizedProbs = validItems.map(item => item.probability / totalProb);

    rand = Math.random();
    cumProb = 0;
    let selectedGiftId = validItems[0].giftId;
    for (let i = 0; i < validItems.length; i++) {
      cumProb += normalizedProbs[i];
      if (rand < cumProb) {
        selectedGiftId = validItems[i].giftId;
        break;
      }
    }

    // Сохраняем спин
    const liveSpin = new LiveSpin({
      giftId: selectedGiftId,
      caseId: selectedCase.caseId,
    });
    await liveSpin.save();

    // Получаем данные о подарке
    const gift = await Gift.findOne({ giftId: selectedGiftId }).lean();
    const spinData = {
      id: liveSpin._id,
      giftId: liveSpin.giftId,
      caseId: liveSpin.caseId,
      createdAt: liveSpin.createdAt,
      gift: gift ? {
        name: gift.name,
        image: gift.image,
        price: gift.price,
      } : null,
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

    // Планируем следующий спин (3-8 сек)
    const delay = Math.floor(Math.random() * 5000) + 3000; // 3000-8000 мс
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