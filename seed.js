const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Gift = require('./models/Gift');
const Case = require('./models/Case');

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

const seedDB = async () => {
  await connectDB();

  // Очищаем коллекции
  await Gift.deleteMany({});
  await Case.deleteMany({});

  // Подарки (из gifts.js)
  const gifts = [
    { giftId: 'gift_001', name: 'none', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183343/1_qlm5at.png', price: 0 },
    { giftId: 'gift_002', name: 'heart', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183353/2_jvtcjs.png', price: 15 },
    { giftId: 'gift_003', name: 'teddy', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183354/3_fd81el.png', price: 15 },
    { giftId: 'gift_004', name: 'gift', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183353/4_bcuxgp.png', price: 25 },
    { giftId: 'gift_005', name: 'flower', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183354/5_zksxqh.png', price: 25 },
    { giftId: 'gift_006', name: 'cake', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183355/6_xz261d.png', price: 50 },
    { giftId: 'gift_007', name: 'flowers', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183355/7_hryhjb.png', price: 50 },
    { giftId: 'gift_008', name: 'rocket', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183355/8_f2cfz7.png', price: 50 },
    { giftId: 'gift_009', name: 'ton01', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183356/9_c8s0k0.png', price: 50 },
    { giftId: 'gift_010', name: 'cup', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183357/10_uxaqjb.png', price: 100 },
    { giftId: 'gift_011', name: 'ring', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183357/11_frzy0v.png', price: 100 },
    { giftId: 'gift_012', name: 'diamond', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183358/12_brn4su.png', price: 100 },
    { giftId: 'gift_013', name: 'ton1', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183358/13_kenr4x.png', price: 100 },
    { giftId: 'gift_014', name: 'rings', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183359/14_yjkykn.png', price: 150 },
    { giftId: 'gift_015', name: 'lolipop', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183360/15_danmlk.png', price: 330 },
    { giftId: 'gift_016', name: 'happybday', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183360/16_v3qyql.png', price: 350 },
    { giftId: 'gift_017', name: 'coockie', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183361/17_pyktkv.png', price: 400 },
    { giftId: 'gift_018', name: 'jester', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183362/18_fn9i3c.png', price: 400 },
    { giftId: 'gift_019', name: 'partysparkle', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183362/19_pdlx9m.png', price: 450 },
    { giftId: 'gift_020', name: 'ton5', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183363/20_t72cym.png', price: 500 },
    { giftId: 'gift_021', name: 'notepad', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183364/21_sizdmk.png', price: 700 },
    { giftId: 'gift_022', name: 'tgpremium1m', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183365/22_ossbsd.png', price: 1000 },
    { giftId: 'gift_023', name: 'hat', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183365/23_vnptxe.png', price: 1700 },
    { giftId: 'gift_024', name: 'potion', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183367/24_tsbdvb.png', price: 2500 },
    { giftId: 'gift_025', name: 'tgpremium3m', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183367/25_kv0ddw.png', price: 2500 },
    { giftId: 'gift_026', name: 'ton25', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183368/26_ovabyl.png', price: 2500 },
    { giftId: 'gift_027', name: 'vodoo', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183369/27_t34hwu.png', price: 3700 },
    { giftId: 'gift_028', name: 'helmet', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183370/28_ckhfcw.png', price: 4900 },
    { giftId: 'gift_029', name: 'swisswatch', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183371/29_ej73yy.png', price: 6000 },
    { giftId: 'gift_030', name: 'signetring', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183372/30_y9uzf7.png', price: 6000 },
    { giftId: 'gift_031', name: 'cigar', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183372/31_sqvmus.png', price: 7400 },
    { giftId: 'gift_032', name: 'genielamp', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183373/32_hg5nia.png', price: 8800 },
    { giftId: 'gift_033', name: 'lootbag', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183374/33_pq7v2w.png', price: 9600 },
    { giftId: 'gift_034', name: 'astralshard', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183375/34_au2jpu.png', price: 15000 },
    { giftId: 'gift_035', name: 'preciouspeach', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183376/35_jhrntt.png', price: 50000 },
    { giftId: 'gift_036', name: 'durovscap', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183377/36_hml1o0.png', price: 95000 },
    { giftId: 'gift_037', name: 'plushpepe', image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183377/37_ulpwle.png', price: 900000 },
  ];

  await Gift.insertMany(gifts);
  console.log('Подарки закинуты в базу, братан!');

  // Кейсы (из cases.js)
  const cases = [
    {
      caseId: 'case_1',
      name: 'Базовый кейс',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183401/case1_lkfa95.png',
      price: 25,
      isTopup: false,
      items: [
        { giftId: 'gift_002', probability: 0.35 },
        { giftId: 'gift_003', probability: 0.35 },
        { giftId: 'gift_004', probability: 0.20 },
        { giftId: 'gift_010', probability: 0.0333 },
        { giftId: 'gift_011', probability: 0.0333 },
        { giftId: 'gift_012', probability: 0.0334 },
      ],
    },
    {
      caseId: 'case_2',
      name: 'Начало',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183402/case2_vwpew1.png',
      price: 100,
      isTopup: false,
      items: [
        { giftId: 'gift_003', probability: 0.20 },
        { giftId: 'gift_005', probability: 0.20 },
        { giftId: 'gift_006', probability: 0.20 },
        { giftId: 'gift_013', probability: 0.20 },
        { giftId: 'gift_011', probability: 0.15 },
        { giftId: 'gift_015', probability: 0.025 },
        { giftId: 'gift_016', probability: 0.025 },
      ],
    },
    {
      caseId: 'case_3',
      name: 'Игрок',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183403/case4_mfka4c.png',
      price: 250,
      isTopup: false,
      items: [
        { giftId: 'gift_007', probability: 0.35 },
        { giftId: 'gift_008', probability: 0.35 },
        { giftId: 'gift_014', probability: 0.15 },
        { giftId: 'gift_015', probability: 0.08 },
        { giftId: 'gift_018', probability: 0.06 },
        { giftId: 'gift_023', probability: 0.01 },
      ],
    },
    {
      caseId: 'case_4',
      name: 'Серьезный',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183428/case5_qmsx1t.png',
      price: 500,
      isTopup: false,
      items: [
        { giftId: 'gift_008', probability: 0.15 },
        { giftId: 'gift_012', probability: 0.15 },
        { giftId: 'gift_013', probability: 0.15 },
        { giftId: 'gift_016', probability: 0.20 },
        { giftId: 'gift_020', probability: 0.20 },
        { giftId: 'gift_021', probability: 0.12 },
        { giftId: 'gift_024', probability: 0.02 },
        { giftId: 'gift_026', probability: 0.005 },
        { giftId: 'gift_027', probability: 0.005 },
      ],
    },
        {
      caseId: 'case_5',
      name: 'Продвинутый',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183402/case3_zwo4xy.png',
      price: 1200,
      isTopup: false,
      items: [
        { giftId: 'gift_012', probability: 0.15 },
        { giftId: 'gift_014', probability: 0.15 },
        { giftId: 'gift_015', probability: 0.15 },
        { giftId: 'gift_021', probability: 0.20 },
        { giftId: 'gift_022', probability: 0.20 },
        { giftId: 'gift_025', probability: 0.10 },
        { giftId: 'gift_028', probability: 0.03 },
        { giftId: 'gift_029', probability: 0.01 },
        { giftId: 'gift_030', probability: 0.01 },
      ],
    },
    {
      caseId: 'case_6',
      name: 'НФТ кейс',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183429/case6_druzwt.png',
      price: 1500,
      isTopup: false,
      items: [
        { giftId: 'gift_015', probability: 0.20 },
        { giftId: 'gift_016', probability: 0.20 },
        { giftId: 'gift_017', probability: 0.15 },
        { giftId: 'gift_018', probability: 0.15 },
        { giftId: 'gift_019', probability: 0.15 },
        { giftId: 'gift_023', probability: 0.08 },
        { giftId: 'gift_024', probability: 0.05 },
        { giftId: 'gift_027', probability: 0.02 },
        { giftId: 'gift_028', probability: 0.01 },
        { giftId: 'gift_029', probability: 0.005 },
        { giftId: 'gift_030', probability: 0.005 },
        { giftId: 'gift_031', probability: 0.005 },
      ],
    },
    {
      caseId: 'case_7',
      name: 'Богатый',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183429/case7_hh3z5a.png',
      price: 2500,
      isTopup: false,
      items: [
        { giftId: 'gift_008', probability: 0.25 },
        { giftId: 'gift_017', probability: 0.20 },
        { giftId: 'gift_021', probability: 0.20 },
        { giftId: 'gift_023', probability: 0.15 },
        { giftId: 'gift_024', probability: 0.10 },
        { giftId: 'gift_029', probability: 0.05 },
        { giftId: 'gift_030', probability: 0.03 },
        { giftId: 'gift_031', probability: 0.02 },
        { giftId: 'gift_032', probability: 0.01 },
      ],
    },
    {
      caseId: 'case_8',
      name: 'Чемпион',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183430/case8_egayf5.png',
      price: 5000,
      isTopup: false,
      items: [
        { giftId: 'gift_013', probability: 0.20 },
        { giftId: 'gift_019', probability: 0.20 },
        { giftId: 'gift_024', probability: 0.15 },
        { giftId: 'gift_027', probability: 0.10 },
        { giftId: 'gift_030', probability: 0.08 },
        { giftId: 'gift_031', probability: 0.08 },
        { giftId: 'gift_032', probability: 0.07 },
        { giftId: 'gift_033', probability: 0.04 },
        { giftId: 'gift_034', probability: 0.01 },
      ],
    },
    {
      caseId: 'case_9',
      name: 'Титан',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183431/case9_tz3kn3.png',
      price: 10000,
      isTopup: false,
      items: [
        { giftId: 'gift_023', probability: 0.25 },
        { giftId: 'gift_026', probability: 0.20 },
        { giftId: 'gift_027', probability: 0.20 },
        { giftId: 'gift_028', probability: 0.15 },
        { giftId: 'gift_034', probability: 0.10 },
        { giftId: 'gift_035', probability: 0.03 },
        { giftId: 'gift_036', probability: 0.0009 },
        { giftId: 'gift_037', probability: 0 },
      ],
    },
    {
      caseId: 'case_10',
      name: 'Пепе Хантер',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183431/case10_usjj84.png',
      price: 25,
      isTopup: false,
      items: [
        { giftId: 'gift_001', probability: 1 },
        { giftId: 'gift_037', probability: 0 },
      ],
    },
    {
      caseId: 'case_11',
      name: 'Дуровс Кеп Хантер',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183432/case11_kqpsgv.png',
      price: 20,
      isTopup: false,
      items: [
        { giftId: 'gift_001', probability: 1 },
        { giftId: 'gift_036', probability: 0 },
      ],
    },
    {
      caseId: 'case_12',
      name: 'Пресиоуспич Хантер',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183433/case12_s7hoff.png',
      price: 15,
      isTopup: false,
      items: [
        { giftId: 'gift_001', probability: 1 },
        { giftId: 'gift_035', probability: 0 },
      ],
    },
    {
      caseId: 'case_13',
      name: 'Free Daily',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183434/case13_tdnjrm.png',
      price: 0,
      isTopup: false,
      items: [
        { giftId: 'gift_001', probability: 0.1795 },
        { giftId: 'gift_002', probability: 0.301 },
        { giftId: 'gift_003', probability: 0.301 },
        { giftId: 'gift_004', probability: 0.208 },
        { giftId: 'gift_005', probability: 0.008 },
        { giftId: 'gift_006', probability: 0.005 },
        { giftId: 'gift_007', probability: 0.005 },
        { giftId: 'gift_010', probability: 0.0001 },
        { giftId: 'gift_021', probability: 0.00001 },
      ],
    },
    {
      caseId: 'case_14',
      name: 'За 500 пополнения',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183434/case14_wojsdx.png',
      price: 0,
      isTopup: true,
      items: [
        { giftId: 'gift_007', probability: 0.30 },
        { giftId: 'gift_008', probability: 0.25 },
        { giftId: 'gift_009', probability: 0.20 },
        { giftId: 'gift_010', probability: 0.10 },
        { giftId: 'gift_011', probability: 0.10 },
        { giftId: 'gift_017', probability: 0.02 },
        { giftId: 'gift_018', probability: 0.015 },
        { giftId: 'gift_019', probability: 0.01 },
        { giftId: 'gift_020', probability: 0.005 },
      ],
    },
    {
      caseId: 'case_15',
      name: 'За 1000 пополнения',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183435/case15_wnaent.png',
      price: 0,
      isTopup: true,
      items: [
        { giftId: 'gift_011', probability: 0.25 },
        { giftId: 'gift_012', probability: 0.25 },
        { giftId: 'gift_013', probability: 0.20 },
        { giftId: 'gift_014', probability: 0.15 },
        { giftId: 'gift_015', probability: 0.08 },
        { giftId: 'gift_016', probability: 0.05 },
        { giftId: 'gift_017', probability: 0.01 },
        { giftId: 'gift_027', probability: 0.005 },
        { giftId: 'gift_028', probability: 0.005 },
      ],
    },
    {
      caseId: 'case_16',
      name: 'За 5000 пополнения',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183436/case16_gkiocv.png',
      price: 0,
      isTopup: true,
      items: [
        { giftId: 'gift_015', probability: 0.20 },
        { giftId: 'gift_016', probability: 0.20 },
        { giftId: 'gift_017', probability: 0.15 },
        { giftId: 'gift_018', probability: 0.15 },
        { giftId: 'gift_019', probability: 0.10 },
        { giftId: 'gift_020', probability: 0.10 },
        { giftId: 'gift_023', probability: 0.05 },
        { giftId: 'gift_024', probability: 0.03 },
        { giftId: 'gift_031', probability: 0.02 },
      ],
    },
    {
      caseId: 'case_17',
      name: 'За 10000 пополнений',
      image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748183437/case17_svfxyh.png',
      price: 0,
      isTopup: true,
      items: [
      { giftId: 'gift_017', probability: 0.20 },
      { giftId: 'gift_023', probability: 0.15 },
      { giftId: 'gift_024', probability: 0.10 },
      { giftId: 'gift_025', probability: 0.10 },
      { giftId: 'gift_026', probability: 0.10 },
      { giftId: 'gift_027', probability: 0.08 },
      { giftId: 'gift_028', probability: 0.08 },
      { giftId: 'gift_029', probability: 0.05 },
      { giftId: 'gift_030', probability: 0.05 },
      { giftId: 'gift_031', probability: 0.03 },
      { giftId: 'gift_032', probability: 0.02 },
      { giftId: 'gift_033', probability: 0.02 },
      { giftId: 'gift_034', probability: 0.01 },
      { giftId: 'gift_035', probability: 0.002 },
      { giftId: 'gift_036', probability: 0.001 },
      { giftId: 'gift_037', probability: 0.000 }
    ],
    },
  {
    caseId: 'case_18',
    name: '15 Рефералов',
    image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748533589/18_l5eajv.png', // Логотип от case_1
    price: 0,
    diamondPrice: 15,
    isTopup: false,
    isReferral: true,
    items: [
      { giftId: 'gift_002', probability: 0.475 }, // Дешёвка
      { giftId: 'gift_005', probability: 0.475 }, // Дешёвка
      { giftId: 'gift_010', probability: 0.0245 }, // Среднее
      { giftId: 'gift_015', probability: 0.0245 }, // Среднее
      { giftId: 'gift_020', probability: 0.001 } // Пиздатое
    ]
  },
  {
    caseId: 'case_19',
    name: '50 Рефералов',
    image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748533589/19_l6zyw6.png', // Логотип от case_2
    price: 0,
    diamondPrice: 50,
    isTopup: false,
    isReferral: true,
    items: [
      { giftId: 'gift_008', probability: 0.95 }, // Дешёвка
      { giftId: 'gift_012', probability: 0.0163 }, // Среднее
      { giftId: 'gift_016', probability: 0.0163 }, // Среднее
      { giftId: 'gift_021', probability: 0.0164 }, // Среднее
      { giftId: 'gift_025', probability: 0.0005 }, // Пиздатое
      { giftId: 'gift_030', probability: 0 } // Пиздатое
    ]
  },
  {
    caseId: 'case_20',
    name: '150 Рефералов',
    image: 'https://res.cloudinary.com/dxwmlthtf/image/upload/v1748533589/20_oorjlv.png', // Логотип от case_3
    price: 0,
    diamondPrice: 150,
    isTopup: false,
    isReferral: true,
    items: [
      { giftId: 'gift_015', probability: 0.475 }, // Дешёвка (ну, относительно)
      { giftId: 'gift_018', probability: 0.475 }, // Дешёвка (ну, относительно)
      { giftId: 'gift_023', probability: 0.0245 }, // Среднее
      { giftId: 'gift_027', probability: 0.0245 }, // Среднее
      { giftId: 'gift_032', probability: 0 }, // Пиздатое
      { giftId: 'gift_035', probability: 0 }, // Пиздатое
      { giftId: 'gift_037', probability: 0 } // Пиздатое
    ]
  }
  ];

  await Case.insertMany(cases);
  console.log('Кейсы закинуты в базу, братан!');

  mongoose.connection.close();
  console.log('База закрыта, всё ок!');
};

seedDB();