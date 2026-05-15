require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json());

// Auth Bypass (Keeps your triggers happy)
app.use((req, res, next) => {
    req.user = { id: 1, warehouse_id: 1, role: 'admin' }; 
    next();
});

// 2. ROUTE IMPORTS (Crucial: Define the variables here!)
const shiftRoutes = require('./src/Routes/shiftroutes');
const payrollRoutes = require('./src/Routes/payrollroutes');
const auditRoutes = require('./src/Routes/auditroutes'); // <--- YOU WERE MISSING THIS LINE

// 3. API ENDPOINTS
app.use('/api/delivery-shifts', shiftRoutes);
app.use('/api/attendance', shiftRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/audit', auditRoutes); // <--- Now Node knows what 'auditRoutes' is!

// 4. SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});