const db = require('../config/db');
const bcrypt = require('bcrypt');

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
            [warehouse_id || 1, roleId, first_name, last_name, email, hashedPassword, req.body.phone || null, hourly_rate, cleanAarto, cleanPrdp]
        );
        res.status(201).json({ success: true, employee_id: result.insertId });
    } catch (err) { next(err); }
};

const updateEmployee = async (req, res, next) => {
    const { id } = req.params;
    const { 
        first_name, 
        last_name, 
        email, 
        role, 
        warehouse_id, 
        hourly_rate,
        aarto_violations,
        prdp_expiry 
    } = req.body;

    const connection = await db.getConnection();
    
    try {
        const adminActorId = 
            req.user?.Employee_ID || 
            req.user?.employee_id || 
            req.user?.employeeId || 
            req.user?.id || 
            req.user?.userId || 
            req.userId || 
            1;

        await connection.query("SET @current_user_id = ?;", [adminActorId]);

        const [roleRows] = await connection.query("SELECT Role_ID FROM Role WHERE LOWER(Name) = ?", [role.toLowerCase()]);
        const roleId = roleRows[0]?.Role_ID || 1;

        const cleanAarto = aarto_violations && aarto_violations !== '' ? parseInt(aarto_violations) : 0;
        
        let cleanPrdp = null;
        if (prdp_expiry && prdp_expiry !== '') {
            cleanPrdp = prdp_expiry.includes('T') ? prdp_expiry.split('T')[0] : prdp_expiry.substring(0, 10);
        }

        await connection.query(
            `UPDATE Employee 
             SET First_Name = ?, Last_Name = ?, Email = ?, Role_ID = ?, Warehouse_ID = ?, Hourly_Rate = ?, AARTO_Violations = ?, Prdp_Expiry = ? 
             WHERE Employee_ID = ?`,
            [first_name, last_name, email, roleId, warehouse_id || 1, hourly_rate, cleanAarto, cleanPrdp, id]
        );
        res.json({ success: true, message: "Employee updated successfully!" });
    } catch (err) { 
        next(err); 
    } finally {
        connection.release();
    }
};

const removeEmployee = async (req, res, next) => {
    try {
        const [result] = await db.query("DELETE FROM Employee WHERE Employee_ID = ?", [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        res.json({ success: true, message: "Employee deleted successfully!" });
    } catch (err) { next(err); }
};

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