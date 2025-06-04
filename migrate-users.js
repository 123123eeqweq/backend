const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

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

const migrateUsers = async () => {
  await connectDB();

  try {
    const users = await User.find();
    for (const user of users) {
      if (user.totalDeposits === undefined) {
        user.totalDeposits = 0;
      }
      if (user.openedTopupCases === undefined) {
        user.openedTopupCases = [];
      }
      await user.save();
    }
    console.log('Миграция юзеров завершена, всё по кайфу!');
  } catch (error) {
    console.error('Ошибка миграции:', error);
  } finally {
    mongoose.connection.close();
    console.log('База закрыта, до встречи!');
  }
};

migrateUsers();