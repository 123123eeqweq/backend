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
const promoRoutes = require('./routes/promo');
const starsRoutes = require('./routes/stars');
const { Server } = require('socket.io');
const http = require('http');
const LiveSpin = require('./models/LiveSpin');
const Gift = require('./models/Gift');

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
app.use('/api/promo', promoRoutes);
app.use('/api/stars', starsRoutes);

// Тестовый эндпоинт
app.get('/', (req, res) => {
  res.json({ message: 'Сервер для рулетки запущен' });
});

// Фоновая задача для генерации спинов
const generateLiveSpin = async () => {
  try {
    const gifts = await Gift.find().lean();
    const validGifts = gifts.filter(gift => gift.giftId !== 'gift_001');
    if (validGifts.length === 0) {
      setTimeout(generateLiveSpin, 3000);
      return;
    }

    const weights = validGifts.map(gift => {
      const price = gift.price || 1;
      let weight = 1 / (price / 1000 + 1);
      if (price >= 200 && price <= 5000) weight *= 2;
      return weight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const probabilities = weights.map(weight => weight / totalWeight);

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

    const liveSpin = new LiveSpin({
      giftId: selectedGift.giftId,
      caseId: 'fake_case',
    });
    await liveSpin.save();

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

    io.emit('newLiveSpin', spinData);

    const spinCount = await LiveSpin.countDocuments();
    if (spinCount > 100) {
      const oldestSpins = await LiveSpin.find()
        .sort({ createdAt: 1 })
        .limit(spinCount - 100);
      await LiveSpin.deleteMany({ _id: { $in: oldestSpins.map(s => s._id) } });
    }

    const delay = Math.floor(Math.random() * 5000) + 3000;
    setTimeout(generateLiveSpin, delay);
  } catch (error) {
    setTimeout(generateLiveSpin, 3000);
  }
};

generateLiveSpin();

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`200 ok`);
});