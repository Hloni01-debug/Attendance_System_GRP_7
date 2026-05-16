require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Core Middlewares
app.use(cors()); 
app.use(express.json()); 


app.use('/api', require('./src/routes/apiRoutes'));


app.use((err, req, res, next) => {
    console.error('Server Exception Intercepted:', err.stack || err.message);
    
    
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(400).json({
            success: false,
            message: 'Database operation rejected. Check data constraints.',
            error: err.message
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'An unexpected internal server error occurred.'
    });
});

// 4. Start Server Listening Engine
app.listen(PORT, () => {
    console.log(`Liftex backend server running on http://localhost:${PORT}/api`);
});