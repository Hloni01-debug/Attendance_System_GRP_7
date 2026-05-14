const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); 
const morgan = require('morgan');
const db = require('./db');
require('dotenv').config();

const app = express();

app.use(helmet());           
app.use(morgan('dev'));      
app.use(cors());
app.use(express.json());

// basic test api
app.get('/api/drivers/compliance', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM v_Driver_Compliance');
    res.json(rows); 
  } catch (error) {
    // error if DB port is closed or if wrong password used
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Could not connect to database" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Liftex API running on http://localhost:${PORT}`);
});