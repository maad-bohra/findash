const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    default: '💳',
  },
  color: {
    type: String,
    default: '#94a3b8',
  },
})

module.exports = mongoose.model('Category', categorySchema)
