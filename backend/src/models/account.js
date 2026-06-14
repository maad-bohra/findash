const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank', 'UPI', 'Credit Card'],
  },
  balance: { type: Number, required: true, default: 0 },
  icon:    { type: String, default: '🏦' },
  color:   { type: String, default: '#4f8ef7' },
  creditLimit: { type: Number, default: null },
  bankName:    { type: String, default: '' },
  upiId:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
