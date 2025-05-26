const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  isTopup: { type: Boolean, default: false },
  items: [
    {
      giftId: { type: String, required: true },
      probability: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model('Case', caseSchema);