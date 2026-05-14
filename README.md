# Atendance_System_GRP_7
# Liftex — Delivery Intelligence & Attendance Management System

> CMPG 311 Database Systems Group Project | Built by 8 students

Liftex is a full-stack web application designed to streamline employee attendance tracking, parcel logistics, payroll automation, and audit logging for a delivery company.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React.js, Tailwind CSS, React Router, Axios |
| Backend    | Node.js, Express.js                 |
| Database   | MySQL                               |
| Auth       | JWT, bcrypt                         |
| Dev Tools  | Vite, nodemon, dotenv               |

---

## Project Structure

```
liftex/
├── database/         # SQL schema, seed data, and useful queries
├── backend/          # Express REST API
└── frontend/         # React + Tailwind frontend (Vite)
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8+
- npm or yarn

### Required to run the backend and frontend

# Backend (run code below)
```bash
cd ../backend
npm install express cors helmet morgan mysql2 dotenv jsonwebtoken bcryptjs
npm install -D nodemon"
cd ../frontend
npm install react@18.2.0 react-dom@18.2.0 react-router-dom@6.20.0 axios@1.6.2 date-fns@2.30.0 recharts@2.10.0 react-hot-toast@2.4.1 react-hook-form@7.48.0 zustand@4.4.7 @tanstack/react-query@5.12.0 lucide-react@0.294.0
npm install -D @vitejs/plugin-react@4.2.0 vite@5.0.0 tailwindcss@3.3.6 autoprefixer@10.4.16 postcss@8.4.32 eslint@8.53.0 eslint-plugin-react@7.33.2 eslint-plugin-react-hooks@4.6.0 eslint-plugin-react-refresh@0.4.4"
```
---

### 1. Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Run schema and seed
source database/schema.sql
source database/seed.sql
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# Start development server
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## Default Test Credentials

After seeding the database:
- **Admin:** admin@liftex.co.za / password123
- **Driver:** driver1@liftex.co.za / password123

---

##Team Members

This project was built by 8 students as part of CMPG 311 — Database Systems at North-West University.

---

## License

MIT — for academic use only.
