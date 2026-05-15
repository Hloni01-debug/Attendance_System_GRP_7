const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./src/Routes/authRoutes');
const vehicleRoutes = require('./src/Routes/vehicleRoutes');
const shiftRoutes = require('./src/Routes/shiftroutes');
const payrollRoutes = require('./src/Routes/payrollroutes');
const auditRoutes = require('./src/Routes/auditroutes');     

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/attendance', shiftRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/audit', auditRoutes);


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "An error occurred"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));