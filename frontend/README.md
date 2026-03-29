# FinDash — React Frontend

A React + Vite rewrite of the FinDash personal finance dashboard,
connected to your existing Node.js backend at `localhost:3000`.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (make sure your backend is already running)
npm run dev
```

The Vite dev server runs on **http://localhost:5173** and proxies all
`/api/*` requests to `http://localhost:3000` automatically — no CORS
issues, no changes needed to your backend.

## Build for production

```bash
npm run build
# output goes to /dist — serve it with any static host or Express
```

## Project structure

```
findash/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx            ← routing (login / signup / dashboard)
    ├── index.css          ← global CSS variables & animations
    └── components/
        ├── Login.jsx
        ├── Signup.jsx
        ├── Auth.module.css
        ├── Dashboard.jsx  ← main dashboard (cards, chart, transactions)
        └── Dashboard.module.css
```

## API endpoints used

| Method | Path                    | Purpose             |
|--------|-------------------------|---------------------|
| POST   | /api/login              | Authenticate user   |
| POST   | /api/signup             | Register user       |
| GET    | /api/transactions       | Fetch all           |
| POST   | /api/transactions       | Add transaction     |
| DELETE | /api/transactions/:id   | Delete transaction  |
| GET    | /api/summary            | Balance/income/exp  |
