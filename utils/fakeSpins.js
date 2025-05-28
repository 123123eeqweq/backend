const gifts = require('../seed').gifts; // Импортируем gifts из seed.js

// Функция для генерации случайного спина
const generateFakeSpin = () => {
  // Фильтруем gift_001 (none)
  const validGifts = gifts.filter(gift => gift.id !== 'gift_001');
  
  // Рассчитываем веса: обратная пропорция цены
  const weights = validGifts.map(gift => {
    const price = gift.price || 1; // Избегаем деления на 0
    return 1 / (price / 1000 + 1); // Делим на 1000 для нормализации
  });
  
  // Нормализуем веса в вероятности
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const probabilities = weights.map(weight => weight / totalWeight);
  
  // Выбираем случайный подарок
  let random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < validGifts.length; i++) {
    cumulative += probabilities[i];
    if (random <= cumulative) {
      const gift = validGifts[i];
      return {
        id: `fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        giftId: gift.id,
        gift: {
          id: gift.id,
          name: gift.name,
          image: gift.image,
        },
      };
    }
  }
  
  // Запасной вариант
  const fallbackGift = validGifts[Math.floor(Math.random() * validGifts.length)];
  return {
    id: `fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    giftId: fallbackGift.id,
    gift: {
      id: fallbackGift.id,
      name: fallbackGift.name,
      image: fallbackGift.image,
    },
  };
};

// Хранилище последних 20 спинов
let liveSpins = [];

// Генерация и рассылка спинов
const startFakeSpinGeneration = (io) => {
  setInterval(() => {
    const newSpin = generateFakeSpin();
    liveSpins = [newSpin, ...liveSpins].slice(0, 20); // Храним последние 20
    io.emit('newLiveSpin', newSpin); // Рассылаем всем клиентам
  }, Math.random() * 3000 + 2000); // 2–5 секунд
};

// Получение текущих спинов
const getLiveSpins = () => liveSpins;

module.exports = { startFakeSpinGeneration, getLiveSpins };