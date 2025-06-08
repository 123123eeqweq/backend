require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Настройки
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminIds = process.env.ADMIN_IDS.split(',').map(id => id.trim());
const apiUrl = process.env.API_URL;

// Создаём бота
const bot = new TelegramBot(token, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Йо, бро! 👊 Я бот для начисления баланса. Используй /add <user_id> <amount> или /remove <user_id> <amount> [stars|diamonds]. Только для админов!');
});

// Обработка команды /add
bot.onText(/\/add (\d+) (\d+)(?: (stars|diamonds))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  // Проверка, что отправитель — админ
  if (!adminIds.includes(userId)) {
    return bot.sendMessage(chatId, 'Нахуй иди отсюда 🚫');
  }

  const telegramId = match[1];
  const amount = parseInt(match[2]);
  const type = match[3] || 'stars';

  // Валидация
  if (amount <= 0) {
    return bot.sendMessage(chatId, 'Сумма должна быть больше нуля! 😒');
  }

  try {
    // Отправляем запрос на бэкенд
    const response = await axios.post(apiUrl, {
      telegramId,
      amount,
      type
    });

    bot.sendMessage(chatId, `Goy has been credited! Начислено ${amount} ${type} юзеру ${telegramId}! 💫`);
  } catch (error) {
    if (error.response) {
      bot.sendMessage(chatId, `Ой, косяк: ${error.response.data.message} 😕`);
    } else {
      bot.sendMessage(chatId, 'Сервак отвалился, пни админа! 😅');
    }
  }
});

// Обработка команды /remove
bot.onText(/\/remove (\d+) (\d+)(?: (stars|diamonds))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  // Проверка, что отправитель — админ
  if (!adminIds.includes(userId)) {
    return bot.sendMessage(chatId, 'Нахуй иди отсюда 🚫');
  }

  const telegramId = match[1];
  const amount = parseInt(match[2]);
  const type = match[3] || 'stars';

  // Валидация
  if (amount <= 0) {
    return bot.sendMessage(chatId, 'Сумма должна быть больше нуля! 😒');
  }

  try {
    // Отправляем запрос на бэкенд
    const response = await axios.post(`${apiUrl}/remove`, {
      telegramId,
      amount,
      type
    });

    bot.sendMessage(chatId, `Снято ${amount} ${type} у юзера ${telegramId}! 🗑️`);
  } catch (error) {
    if (error.response) {
      bot.sendMessage(chatId, `Ой, косяк: ${error.response.data.message} 😕`);
    } else {
      bot.sendMessage(chatId, 'Сервак отвалился, пни админа! 😅');
    }
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('Бот запущен! 🚀');