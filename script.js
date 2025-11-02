let expenses = [];
let summaryChart;
let compareChart;
let compareMonthChart;

// 🟢 Fetch all expenses
async function fetchExpenses() {
  const res = await fetch('/api/expenses');
  expenses = await res.json();
  populateMonthSelectors();
  showToday();
}

// 🟢 Add new expense
document.getElementById('expense-form').addEventListener('submit', async e => {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);

  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, category, description, amount })
  });

  const newExpense = await res.json();
  expenses.push(newExpense);
  showToday();
  e.target.reset();
});

// 🟢 Helper: Group by category
function groupByCategory(list) {
  const grouped = {};
  list.forEach(e => {
    grouped[e.category] = (grouped[e.category] || 0) + e.amount;
  });
  return grouped;
}

// 🟢 Render Pie Chart
function renderPieChart(data) {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  if (summaryChart) summaryChart.destroy();
  summaryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ['#1abc9c','#3498db','#9b59b6','#f39c12','#e74c3c','#2ecc71']
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

// 🟢 Update Summary
function updateSummary(list) {
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  const catTotals = groupByCategory(list);
  const topCat = Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';

  document.getElementById('summary-content').innerHTML = `
    <p><strong>Total Spent:</strong> ₹${total.toFixed(2)}</p>
    <p><strong>Top Category:</strong> ${topCat}</p>
  `;
}

// 🟢 Filter Functions
function showToday() {
  highlightButton('today');
  const today = new Date().toISOString().split('T')[0];
  const filtered = expenses.filter(e => e.date.startsWith(today));
  renderPieChart(groupByCategory(filtered));
  updateSummary(filtered);
}

function showMonth() {
  highlightButton('month');
  const now = new Date();
  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  renderPieChart(groupByCategory(filtered));
  updateSummary(filtered);
}

function showYear() {
  highlightButton('year');
  const now = new Date();
  const filtered = expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
  renderPieChart(groupByCategory(filtered));
  updateSummary(filtered);
}

function highlightButton(type) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
}

// 🟢 Filter Buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.type === 'today') showToday();
    else if (btn.dataset.type === 'month') showMonth();
    else showYear();
  });
});

// 🟢 Compare Two Days
document.getElementById('compareBtn').addEventListener('click', () => {
  const d1 = document.getElementById('compareDate1').value;
  const d2 = document.getElementById('compareDate2').value;
  if (!d1 || !d2) return alert('Please select both dates.');

  const data1 = groupByCategory(expenses.filter(e => e.date.startsWith(d1)));
  const data2 = groupByCategory(expenses.filter(e => e.date.startsWith(d2)));

  const categories = [...new Set([...Object.keys(data1), ...Object.keys(data2)])];
  const day1Values = categories.map(c => data1[c] || 0);
  const day2Values = categories.map(c => data2[c] || 0);

  const ctx = document.getElementById('compareChart').getContext('2d');
  if (compareChart) compareChart.destroy();

  compareChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        { label: d1, data: day1Values, backgroundColor: '#3498db' },
        { label: d2, data: day2Values, backgroundColor: '#f39c12' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });

  const sum1 = day1Values.reduce((a,b)=>a+b,0);
  const sum2 = day2Values.reduce((a,b)=>a+b,0);
  const result = sum1 === sum2 ? 'Both days had equal spending'
    : sum1 > sum2 ? `You spent ₹${(sum1-sum2).toFixed(2)} more on ${d1}`
    : `You spent ₹${(sum2-sum1).toFixed(2)} more on ${d2}`;
  document.getElementById('compareResult').textContent = result;
});

// 🟢 Populate Month Selectors
function populateMonthSelectors() {
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const now = new Date();
  const selects = [document.getElementById('month1'), document.getElementById('month2')];
  selects.forEach(sel => {
    sel.innerHTML = monthNames.map((m, i) => `
      <option value="${i}">${m} ${now.getFullYear()}</option>
    `).join('');
  });
  selects[0].value = now.getMonth();
  selects[1].value = (now.getMonth() - 1 + 12) % 12;
}

// 🟢 Compare Two Months
document.getElementById('compareMonthBtn').addEventListener('click', () => {
  const m1 = parseInt(document.getElementById('month1').value);
  const m2 = parseInt(document.getElementById('month2').value);
  const y = new Date().getFullYear();

  const list1 = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === m1 && d.getFullYear() === y;
  });
  const list2 = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === m2 && d.getFullYear() === y;
  });

  const data1 = groupByCategory(list1);
  const data2 = groupByCategory(list2);
  const categories = [...new Set([...Object.keys(data1), ...Object.keys(data2)])];
  const vals1 = categories.map(c => data1[c] || 0);
  const vals2 = categories.map(c => data2[c] || 0);

  const ctx = document.getElementById('compareMonthChart').getContext('2d');
  if (compareMonthChart) compareMonthChart.destroy();

  compareMonthChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        { label: monthName(m1), data: vals1, backgroundColor: '#2ecc71' },
        { label: monthName(m2), data: vals2, backgroundColor: '#e74c3c' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });

  const sum1 = vals1.reduce((a,b)=>a+b,0);
  const sum2 = vals2.reduce((a,b)=>a+b,0);
  const result = sum1 === sum2 ? 'Both months had equal spending'
    : sum1 > sum2 ? `${monthName(m1)} had ₹${(sum1-sum2).toFixed(2)} more expenses`
    : `${monthName(m2)} had ₹${(sum2-sum1).toFixed(2)} more expenses`;
  document.getElementById('compareMonthResult').textContent = result;
});

function monthName(i) {
  return [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ][i];
}

fetchExpenses();
