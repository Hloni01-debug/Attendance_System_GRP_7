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
                e.Hourly_Rate AS hourly_rate
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
    const { first_name, last_name, email, role, warehouse_id, hourly_rate, password } = req.body;
    try {
        
        const [roleRows] = await db.query("SELECT Role_ID FROM Role WHERE LOWER(Name) = ?", [role.toLowerCase()]);
        const roleId = roleRows[0]?.Role_ID || 1;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            `INSERT INTO Employee (Warehouse_ID, Role_ID, First_Name, Last_Name, Email, Password_Hash, Phone, Hourly_Rate) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [warehouse_id || 1, roleId, first_name, last_name, email, hashedPassword, req.body.phone || null, hourly_rate]
        );
        res.status(201).json({ success: true, employee_id: result.insertId });
    } catch (err) { next(err); }
};

// 4. Update Existing Employee Profile
const updateEmployee = async (req, res, next) => {
    const { id } = req.params;
    const { first_name, last_name, email, role, warehouse_id, hourly_rate } = req.body;
    try {
        const [roleRows] = await db.query("SELECT Role_ID FROM Role WHERE LOWER(Name) = ?", [role.toLowerCase()]);
        const roleId = roleRows[0]?.Role_ID || 1;

        await db.query(
            `UPDATE Employee 
             SET First_Name = ?, Last_Name = ?, Email = ?, Role_ID = ?, Warehouse_ID = ?, Hourly_Rate = ? 
             WHERE Employee_ID = ?`,
            [first_name, last_name, email, roleId, warehouse_id || 1, hourly_rate, id]
        );
        res.json({ success: true, message: "Employee updated successfully!" });
    } catch (err) { next(err); }
};

// 5. Remove Employee Entry
const removeEmployee = async (req, res, next) => {
    try {
        const [result] = await db.query("DELETE FROM Employee WHERE Employee_ID = ?", [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        res.json({ success: true, message: "Employee deleted successfully!" });
    } catch (err) { next(err); }
};

// 6. Search Employees 
const searchEmployees = async (req, res, next) => {
    const { q } = req.query;
    try {
        const sql = `
            SELECT 
                e.Employee_ID AS employee_id, 
                e.First_Name AS first_name, 
                e.Last_Name AS last_name, 
                LOWER(r.Name) AS role 
            FROM Employee e
            JOIN Role r ON e.Role_ID = r.Role_ID
            WHERE e.First_Name LIKE ? OR e.Last_Name LIKE ?;
        `;
        const [rows] = await db.query(sql, [`%${q}%`, `%${q}%`]);
        res.json(rows);
    } catch (err) { next(err); }
};


module.exports = {
    fetchEmployees,
    fetchEmployeeById,
    addEmployee,
    updateEmployee,
    removeEmployee,
    searchEmployees
};