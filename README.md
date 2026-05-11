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
