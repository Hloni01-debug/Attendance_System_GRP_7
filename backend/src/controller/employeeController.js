const db = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Get All Employees 
const fetchEmployees = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                e.Employee_ID AS employee_id,
                e.First_Name AS first_name,
                e.Last_Name AS last_name,
                e.Email AS email,
                e.Phone AS phone,
                LOWER(r.Name) AS role,
                e.Warehouse_ID AS warehouse_id,
                w.Name AS warehouse_name,
                e.Hourly_Rate AS hourly_rate,
                e.AARTO_Violations AS aarto_violations,
                e.Prdp_Expiry AS prdp_expiry,
                1 AS is_active
            FROM Employee e
            JOIN Role r ON e.Role_ID = r.Role_ID
            LEFT JOIN Warehouse w ON e.Warehouse_ID = w.Warehouse_ID;
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) { next(err); }
};

// 2. Get Employee By ID
const fetchEmployeeById = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                e.Employee_ID AS employee_id,
                e.First_Name AS first_name,
                e.Last_Name AS last_name,
                e.Email AS email,
                e.Phone AS phone,
                LOWER(r.Name) AS role,
                e.Warehouse_ID AS warehouse_id,
                e.Hourly_Rate AS hourly_rate,
                e.AARTO_Violations AS aarto_violations,
                e.Prdp_Expiry AS prdp_expiry
            FROM Employee e
            JOIN Role r ON e.Role_ID = r.Role_ID
            WHERE e.Employee_ID = ?;
        `;
        const [rows] = await db.query(sql, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        res.json(rows[0]);
    } catch (err) { next(err); }
};

// 3. Add New Employee 
const addEmployee = async (req, res, next) => {
    const { 
        first_name, 
        last_name, 
        email, 
        role, 
        warehouse_id, 
        hourly_rate, 
        password,
        aarto_violations,
        prdp_expiry 
    } = req.body;
    
    try {
        const [roleRows] = await db.query("SELECT Role_ID FROM Role WHERE LOWER(Name) = ?", [role.toLowerCase()]);
        const roleId = roleRows[0]?.Role_ID || 1;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const cleanAarto = aarto_violations && aarto_violations !== '' ? parseInt(aarto_violations) : 0;
        const cleanPrdp = prdp_expiry && prdp_expiry !== '' ? prdp_expiry : null;

        const [result] = await db.query(
            `INSERT INTO Employee (Warehouse_ID, Role_ID, First_Name, Last_Name, Email, Password_Hash, Phone, Hourly_Rate, AARTO_Violations, Prdp_Expiry) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,