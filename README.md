# Findash - Personal Finance Dashboard

<p align="center">
  <img src="./frontend/src/assets/logo.png" width="220" alt="Findash Logo">
</p>

<p align="center">
  <b>A Full Stack Personal Finance Management Application</b>
</p>

<p align="center">
  Track expenses, manage income, analyze spending habits, and monitor your financial growth through an interactive dashboard.
</p>

---

# 📌 Project Overview

**Findash** is a full-stack financial management application built using the MERN stack.

The goal of this project is to provide users with a simple and powerful platform where they can manage their daily finances, track transactions, organize expenses, and visualize their financial activities.

The application provides:

- Secure user authentication
- Personal financial dashboard
- Income and expense tracking
- Wallet/account management
- Category-based transaction organization
- Data visualization using charts
- User profile management
- Admin management system


---

# 🚀 Features

## 👤 User Features

### Authentication

Users can:

- Create an account
- Login securely
- Manage their profile
- Update profile information
- Change password
- Upload profile image


---

## 📊 Financial Dashboard

The dashboard provides a complete overview of user finances.

Users can view:

- Total balance
- Total income
- Total expenses
- Recent transactions
- Account statistics
- Expense analysis charts


---

## 💸 Transaction Management

Users can manage all financial transactions.

Supported transaction types:

- Income
- Expense


Users can:

- Add new transactions
- Delete transactions
- Assign categories
- Select accounts
- Track transaction history


Example:

```
Salary        + ₹50,000
Food          - ₹2,000
Rent          - ₹15,000
Shopping      - ₹5,000
```


---

## 💳 Wallet / Account Management

Users can create and manage multiple accounts.

Examples:

```
Bank Account
Cash Wallet
Savings Account
Credit Card
```


Features:

- Create accounts
- Update account balance
- Delete accounts
- Track account-wise transactions


---

## 🏷️ Category Management

Users can organize expenses using categories.

Default examples:

```
Food
Travel
Shopping
Bills
Entertainment
Investment
Health
```


Users can:

- Create categories
- Assign categories to transactions
- Remove categories


---

# 👑 Admin Panel

Findash includes an administrator dashboard.

Admin users can:

- View all registered users
- Manage users
- Remove users
- Update user information
- Monitor application data


---

# 📈 Analytics and Visualization

The application provides graphical representation of financial data.

Implemented using:

- Recharts


Analytics include:

- Income distribution
- Expense distribution
- Spending trends
- Account balance visualization


---

# 🏗️ System Architecture


```
                 USER

                  |
                  |

              React Frontend

                  |
                  |

             Express REST API

                  |
                  |

              Node.js Server

                  |
                  |

              MongoDB Database

```


---

# 📂 Project Structure


```
Findash
│
├── backend
│   │
│   ├── src
│   │   │
│   │   ├── models
│   │   │   ├── User.js
│   │   │   ├── Transaction.js
│   │   │   ├── Category.js
│   │   │   └── Account.js
│   │   │
│   │   ├── db
│   │   │   └── database.js
│   │   │
│   │   └── app.js
│   │
│   └── server.js
│
│
├── frontend
│   │
│   ├── src
│   │   │
│   │   ├── components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Wallet.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Profile.jsx
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md

```


---

# 🛠️ Technologies Used


## Frontend

| Technology | Purpose |
|------------|---------|
| React.js | User Interface |
| Vite | Development Environment |
| CSS | Styling |
| Recharts | Data Visualization |
| ImageKit | Image Upload |


## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Backend Runtime |
| Express.js | API Development |
| MongoDB | Database |
| Mongoose | Database Modeling |
| dotenv | Environment Variables |
| CORS | API Communication |


---

# 🔌 API Documentation


## Authentication APIs


### Register User

```
POST /api/signup
```


### Login User

```
POST /api/login
```


---

# User APIs


Get User Profile:

```
GET /api/user/profile
```


Update Profile:

```
PUT /api/user/profile
```


Change Password:

```
PUT /api/user/password
```


---

# Transaction APIs


Get Transactions:

```
GET /api/transactions
```


Create Transaction:

```
POST /api/transactions
```


Delete Transaction:

```
DELETE /api/transactions/:id
```


---

# Account APIs


Get Accounts:

```
GET /api/accounts
```


Create Account:

```
POST /api/accounts
```


Update Account:

```
PATCH /api/accounts/:id
```


Delete Account:

```
DELETE /api/accounts/:id
```


---

# Category APIs


Get Categories:

```
GET /api/categories
```


Create Category:

```
POST /api/categories
```


Delete Category:

```
DELETE /api/categories/:id
```


---

# ⚙️ Installation Guide


## Step 1: Clone Repository


```bash
git clone <repository-url>

cd findash-main
```


---

# Backend Setup


Go to backend folder:

```bash
cd backend
```


Install dependencies:


```bash
npm install
```


Create `.env` file:


```
PORT=5000

MONGO_URI=your_mongodb_connection_string

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key

IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key

IMAGEKIT_URL_ENDPOINT=your_imagekit_url
```


Start backend server:


```bash
npm start
```


Backend will run on:


```
http://localhost:5000
```


---

# Frontend Setup


Navigate to frontend:


```bash
cd frontend
```


Install packages:


```bash
npm install
```


Start React application:


```bash
npm run dev
```


Frontend will run on:


```
http://localhost:5173
```


---

# 🗄️ Database Design


## User Collection


```
{
 username,
 email,
 password,
 profileImage,
 isAdmin
}

```


---

## Transaction Collection


```
{
 title,
 amount,
 type,
 category,
 account,
 date,
 description
}

```


---

## Account Collection


```
{
 accountName,
 balance,
 userId
}

```


---

## Category Collection


```
{
 name,
 userId
}

```


---

# 🔐 Security Features


Implemented:

- Environment variable protection
- Secure API communication
- User authorization
- Admin authorization
- Database validation


---

# 🔮 Future Improvements


## Authentication

- JWT authentication
- Password encryption
- Refresh tokens


## Finance Features

- Budget management
- Monthly financial reports
- Recurring payments
- PDF report generation


## AI Integration

Future AI features:

- Smart expense prediction
- Saving recommendations
- Automatic transaction categorization


## Mobile Application

Possible extension:

- Android application
- iOS application


---


# 👨‍💻 Author


**Maad Bohra**

---

# ⭐ Contribution

Contributions are welcome.

Steps:

1. Fork the repository

2. Create a new branch

```
git checkout -b feature-name
```

3. Commit changes

```
git commit -m "Added new feature"
```

4. Push changes

```
git push origin feature-name
```

5. Create a Pull Request


---

# 📜 License

This project is Under the ownership of Maad Bohra.
