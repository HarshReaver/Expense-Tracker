class Utils {
  static formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  static formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  static generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

class Transaction {
  #id;
  #amount;
  #category;
  #date;
  #description;
  #type;

  constructor({ amount, category, date, description, type }) {
    this.#id = Utils.generateId();
    this.#amount = Number(amount);
    this.#category = category;
    this.#date = new Date(date);
    this.#description = description;
    this.#type = type;
  }

  get id() {
    return this.#id;
  }

  get amount() {
    return this.#amount;
  }

  get category() {
    return this.#category;
  }

  get date() {
    return this.#date;
  }

  get description() {
    return this.#description;
  }

  get type() {
    return this.#type;
  }

  toSummary() {
    return {
      id: this.#id,
      amount: this.#amount,
      category: this.#category,
      date: this.#date,
      description: this.#description,
      type: this.#type,
    };
  }
}

class Income extends Transaction {
  constructor(props) {
    super({ ...props, type: 'Income' });
  }
}

class Expense extends Transaction {
  constructor(props) {
    super({ ...props, type: 'Expense' });
  }
}

class Budget {
  #category;
  #limit;

  constructor({ category, limit }) {
    this.#category = category;
    this.#limit = Number(limit);
  }

  get category() {
    return this.#category;
  }

  get limit() {
    return this.#limit;
  }
}

class User {
  #name;
  #transactions;
  #budgetMap;
  #undoStack;
  #scheduledQueue;

  constructor(name) {
    this.#name = name;
    this.#transactions = [];
    this.#budgetMap = new Map();
    this.#undoStack = [];
    this.#scheduledQueue = [];
  }

  get name() {
    return this.#name;
  }

  addBudget(budget) {
    if (!(budget instanceof Budget)) {
      throw new Error('Budget must be a Budget instance.');
    }
    this.#budgetMap.set(budget.category, budget.limit);
  }

  getBudgetLimit(category) {
    return this.#budgetMap.get(category) || 0;
  }

  get budgets() {
    return [...this.#budgetMap.entries()].map(([category, limit]) => ({ category, limit }));
  }

  addTransaction(transaction) {
    if (!(transaction instanceof Transaction)) {
      throw new Error('Transaction must be a Transaction instance.');
    }

    if (!transaction.amount || transaction.amount <= 0) {
      throw new Error('Transaction amount must be a positive number.');
    }

    if (!transaction.category || !transaction.description || Number.isNaN(transaction.date.getTime())) {
      throw new Error('Transaction fields must be valid.');
    }

    const duplicate = this.#transactions.some((item) =>
      item.amount === transaction.amount &&
      item.category === transaction.category &&
      item.description === transaction.description &&
      item.type === transaction.type &&
      item.date.getTime() === transaction.date.getTime()
    );
    if (duplicate) {
      throw new Error('Duplicate transaction detected.');
    }

    this.#transactions.push(transaction);
    this.#undoStack.push(transaction);
  }

  removeLastTransaction() {
    if (this.#undoStack.length === 0) {
      return null;
    }
    const last = this.#undoStack.pop();
    const index = this.#transactions.findIndex((tx) => tx.id === last.id);
    if (index > -1) {
      this.#transactions.splice(index, 1);
    }
    return last;
  }

  scheduleRecurring(transaction) {
    if (!(transaction instanceof Transaction)) {
      throw new Error('Scheduled payment must be a Transaction instance.');
    }
    this.#scheduledQueue.push(transaction);
  }

  processScheduledPayments() {
    const executed = [];
    while (this.#scheduledQueue.length > 0) {
      const transaction = this.#scheduledQueue.shift();
      try {
        this.addTransaction(transaction);
        executed.push(transaction);
      } catch (error) {
        console.warn('Scheduled payment failed:', error.message);
      }
    }
    return executed;
  }

  get transactions() {
    return [...this.#transactions];
  }

  get totalIncome() {
    return this.#transactions.reduce((sum, tx) => sum + (tx.type === 'Income' ? tx.amount : 0), 0);
  }

  get totalExpenses() {
    return this.#transactions.reduce((sum, tx) => sum + (tx.type === 'Expense' ? tx.amount : 0), 0);
  }

  get balance() {
    return this.totalIncome - this.totalExpenses;
  }

  getCategorySpending() {
    const summary = {};
    this.#transactions.forEach((tx) => {
      if (tx.type !== 'Expense') return;
      summary[tx.category] = (summary[tx.category] || 0) + tx.amount;
    });
    return summary;
  }

  getCategorySummaries() {
    const spending = this.getCategorySpending();
    return Object.keys(spending)
      .sort((a, b) => spending[b] - spending[a])
      .map((category) => ({
        category,
        spent: spending[category],
        budget: this.getBudgetLimit(category),
        remaining: this.getBudgetLimit(category) - spending[category],
      }));
  }

  getTopCategories(limit = 3) {
    return Object.entries(this.getCategorySpending())
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, limit)
      .map(([category, amount]) => ({ category, amount }));
  }

  getMonthlyReport() {
    const sorted = [...this.#transactions].sort((a, b) => b.date - a.date);
    return sorted;
  }
}

const state = {
  user: new User('Primary User'),
};

const elements = {
  transactionForm: document.getElementById('transaction-form'),
  budgetForm: document.getElementById('budget-form'),
  transactionType: document.getElementById('transaction-type'),
  transactionAmount: document.getElementById('transaction-amount'),
  transactionCategory: document.getElementById('transaction-category'),
  transactionDate: document.getElementById('transaction-date'),
  transactionDescription: document.getElementById('transaction-description'),
  budgetCategory: document.getElementById('budget-category'),
  budgetAmount: document.getElementById('budget-amount'),
  totalIncome: document.getElementById('total-income'),
  totalExpenses: document.getElementById('total-expenses'),
  remainingBalance: document.getElementById('remaining-balance'),
  transactionsTableBody: document.getElementById('transactions-table-body'),
  categorySummaryBody: document.getElementById('category-summary-body'),
  alertsContainer: document.getElementById('alerts-container'),
  undoButton: document.getElementById('undo-button'),
  queueAddButton: document.getElementById('queue-add-button'),
  processQueueButton: document.getElementById('process-queue-button'),
};

function render() {
  elements.totalIncome.textContent = Utils.formatCurrency(state.user.totalIncome);
  elements.totalExpenses.textContent = Utils.formatCurrency(state.user.totalExpenses);
  elements.remainingBalance.textContent = Utils.formatCurrency(state.user.balance);

  const transactions = state.user.getMonthlyReport();
  elements.transactionsTableBody.innerHTML = transactions
    .map((tx) => `
      <tr>
        <td>${Utils.formatDate(tx.date)}</td>
        <td>${tx.type}</td>
        <td>${tx.category}</td>
        <td>${tx.description}</td>
        <td>${tx.type === 'Expense' ? '-' : ''}${Utils.formatCurrency(tx.amount)}</td>
      </tr>
    `)
    .join('');

  const summaries = state.user.getCategorySummaries();
  elements.categorySummaryBody.innerHTML = summaries
    .map((summary) => `
      <tr>
        <td>${summary.category}</td>
        <td>${Utils.formatCurrency(summary.spent)}</td>
        <td>${summary.budget ? Utils.formatCurrency(summary.budget) : '—'}</td>
        <td>${summary.budget ? Utils.formatCurrency(summary.remaining) : '—'}</td>
      </tr>
    `)
    .join('');

  renderAlerts();
}

function renderAlerts() {
  const alerts = [];
  const spending = state.user.getCategorySpending();

  state.user.budgets.forEach(({ category, limit }) => {
    const spent = spending[category] || 0;
    if (spent > limit) {
      alerts.push({
        message: `Category budget exceeded for ${category}. Limit: ${Utils.formatCurrency(limit)}, spent: ${Utils.formatCurrency(spent)}.`,
        type: 'critical',
      });
    } else if (spent > limit * 0.85) {
      alerts.push({
        message: `Near budget for ${category}. You have ${Utils.formatCurrency(limit - spent)} remaining.`,
        type: 'warning',
      });
    }
  });

  const monthlyBudget = state.user.budgets.reduce((acc, budget) => acc + budget.limit, 0);
  if (monthlyBudget > 0) {
    const expense = state.user.totalExpenses;
    if (expense > monthlyBudget) {
      alerts.push({
        message: `Total expenses exceeded monthly budget by ${Utils.formatCurrency(expense - monthlyBudget)}.`,
        type: 'critical',
      });
    } else if (expense > monthlyBudget * 0.9) {
      alerts.push({
        message: `Total expenses are within 10% of monthly budget. ${Utils.formatCurrency(monthlyBudget - expense)} remaining.`,
        type: 'warning',
      });
    }
  }

  const topCategories = state.user.getTopCategories(3);
  if (topCategories.length >= 2 && topCategories[0].amount > topCategories[1].amount * 2) {
    alerts.push({
      message: `Unusual spending pattern detected: ${topCategories[0].category} is more than twice the second highest category.`,
      type: 'warning',
    });
  }

  elements.alertsContainer.innerHTML = alerts
    .map((alert) => `
      <div class="alert-card ${alert.type === 'critical' ? 'critical' : ''}">
        <strong>${alert.type === 'critical' ? 'Alert:' : 'Notice:'}</strong> ${alert.message}
      </div>
    `)
    .join('');
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  try {
    const transactionData = {
      amount: Number(elements.transactionAmount.value),
      category: elements.transactionCategory.value,
      date: elements.transactionDate.value,
      description: elements.transactionDescription.value.trim(),
      type: elements.transactionType.value,
    };

    let transaction;
    if (transactionData.type === 'Income') {
      transaction = new Income(transactionData);
    } else {
      transaction = new Expense(transactionData);
    }

    state.user.addTransaction(transaction);
    render();
    elements.transactionForm.reset();
  } catch (error) {
    alert(error.message);
  }
}

function handleBudgetSubmit(event) {
  event.preventDefault();

  try {
    const budget = new Budget({
      category: elements.budgetCategory.value,
      limit: Number(elements.budgetAmount.value),
    });
    state.user.addBudget(budget);
    render();
    elements.budgetForm.reset();
  } catch (error) {
    alert(error.message);
  }
}

function handleUndo() {
  const removed = state.user.removeLastTransaction();
  if (removed) {
    render();
    alert(`Removed last transaction: ${removed.description}`);
  } else {
    alert('No transaction available to undo.');
  }
}

function handleQueueAdd() {
  try {
    const transactionData = {
      amount: Number(elements.transactionAmount.value),
      category: elements.transactionCategory.value,
      date: elements.transactionDate.value,
      description: elements.transactionDescription.value.trim() || 'Scheduled payment',
      type: elements.transactionType.value,
    };

    let transaction;
    if (transactionData.type === 'Income') {
      transaction = new Income(transactionData);
    } else {
      transaction = new Expense(transactionData);
    }

    state.user.scheduleRecurring(transaction);
    alert('Payment added to scheduled queue.');
  } catch (error) {
    alert(error.message);
  }
}

function handleProcessQueue() {
  const executed = state.user.processScheduledPayments();
  if (executed.length > 0) {
    render();
    alert(`Processed ${executed.length} scheduled payment(s).`);
  } else {
    alert('No scheduled payments to process.');
  }
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  elements.transactionDate.value = today;
}

window.addEventListener('DOMContentLoaded', () => {
  setDefaultDate();
  elements.transactionForm.addEventListener('submit', handleTransactionSubmit);
  elements.budgetForm.addEventListener('submit', handleBudgetSubmit);
  elements.undoButton.addEventListener('click', handleUndo);
  elements.queueAddButton.addEventListener('click', handleQueueAdd);
  elements.processQueueButton.addEventListener('click', handleProcessQueue);
  render();
});
