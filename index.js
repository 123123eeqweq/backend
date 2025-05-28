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
const { Server } = require('socket.io');
const http = require('http');
const { startFakeSpinGeneration, getLiveSpins } = require('./utils/fakeSpins');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://t.me'], // Явно разрешаем локалхост и Telegram
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://t.me'], // Явно разрешаем локалхост и Telegram
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
  credentials: true,
}));
app.use(express.json());

// Обработка preflight запросов
app.options('*', cors());

// Подключение к MongoDB
connectDB();

// Логирование подключений WebSocket
io.on('connection', (socket) => {
  console.log(`WebSocket клиент подключился: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`WebSocket клиент отключился: ${socket.id}`);
  });
});

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
  console.log('Запрос /api/live-spins');
  res.json(getLiveSpins());
});

// Запускаем генерацию фейковых спинов
startFakeSpinGeneration(io);

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервак пашет на порту ${PORT}, братан!`);
});