const pool = require('../config/db');

const getEmployeeByEmail = async (email) => {
    const [rows] = await pool.query(
        `SELECT * FROM Employee WHERE Email = ?`,
        [email]
    );
    return rows[0];
};

const createEmployee = async (warehouseId, roleId, firstName, lastName, email, phone, hourlyRate, Password_Hash, prdpExpiry) => {
    const [result] = await pool.query(
        `INSERT INTO Employee 
        (Warehouse_ID, Role_ID, First_Name, Last_Name, Email, Phone, Hourly_Rate, Password_Hash, Prdp_Expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [warehouseId, roleId, firstName, lastName, email, phone, hourlyRate, Password_Hash, prdpExpiry]
    );
    return result; 
};

module.exports = { getEmployeeByEmail, createEmployee };