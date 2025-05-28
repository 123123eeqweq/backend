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
const { startFakeSpinGeneration, getLiveSpins } = require('./utils/fakeSpins'); // Импорт fakeSpins

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

// Роут для получения текущих спинов
app.get('/api/live-spins', (req, res) => {
  res.json(getLiveSpins());
});

// Запускаем генерацию фейковых спинов
startFakeSpinGeneration(io);

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервак пашет на порту ${PORT}, братан!`);
});