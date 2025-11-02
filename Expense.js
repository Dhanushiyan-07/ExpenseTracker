const mongoose = require('mongoose');

// Define structure of an expense
const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Export model
module.exports = mongoose.model('Expense', expenseSchema);
