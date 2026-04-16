# Expense Tracker & Budget Planner

A JavaScript-based personal finance application that helps track income, expenses, and budgets while demonstrating OOP principles, linear data structures, and sorting logic.

## Features

- Add income and expense transactions
- Categorize transactions
- Set monthly budgets per category
- View total income, expenses, and remaining balance
- Undo the last transaction using a stack
- Schedule recurring payments with a queue
- Generate alerts for budget and spending patterns
- Sort transactions by date and identify top spending categories

## Files

- `index.html` - UI layout
- `styles.css` - visual styling
- `script.js` - application logic and OOP implementation

## System Architecture

This is a client-side (no backend) web app. All data lives in memory while the page is open, and the UI updates immediately after each user interaction.

- **Presentation (HTML/CSS):** `index.html` defines the structure (forms, tables/lists, summary panels). `styles.css` handles layout and visual styling.
- **Application Logic (JavaScript):** `script.js` contains the event handlers, data structures (transactions list, undo stack, recurring queue), calculations (totals/budgets), sorting, and the render/update routines.

**Runtime flow:** User actions (submit transaction/budget, undo, schedule payment) trigger JS handlers → handlers update the in-memory model → calculations/alerts run → the UI is re-rendered to reflect the latest state.

```mermaid
flowchart TD
  U[User] -->|Clicks / Submits forms| UI[index.html UI عناصر]
  UI -->|DOM events| H[Event Handlers (script.js)]

  H --> M[In-memory Data Model]
  M --> T[Transactions Array/List]
  M --> S[Undo Stack]
  M --> Q[Recurring Payments Queue]

  H --> C[Calculations & Rules]
  C --> B[Budgets by Category]
  C --> A[Alerts & Insights]
  C --> O[Sorting / Top Categories]

  H --> R[Render / DOM Update]
  R --> UI

  note1((No backend / no database)) --- M
```

## Usage

Open `index.html` in a browser and use the forms to add transactions and budgets. The app will update totals, category summaries, and alerts automatically.