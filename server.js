const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Import Expense model
const Expense = require('./models/Expense');

// ✅ Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ✅ Add new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { date, category, description, amount } = req.body;

    if (!date || !category || !description || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const expense = new Expense({
      date,
      category,
      description,
      amount: parseFloat(amount)
    });

    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// ✅ Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ✅ Start server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
