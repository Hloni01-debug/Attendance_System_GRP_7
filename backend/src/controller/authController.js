const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res, next) => {
    const { warehouse_id, role_id, first_name, last_name, email, phone, hourly_rate, password, prdp_expiry } = req.body;
    try {
        const [existing] = await db.query("SELECT * FROM Employee WHERE Email = ?", [email]);
        if (existing.length > 0) return res.status(409).json({ message: "Email already exists." });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            `INSERT INTO Employee (Warehouse_ID, Role_ID, First_Name, Last_Name, Email, Password_Hash, Phone, Hourly_Rate, Prdp_Expiry) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [warehouse_id, role_id, first_name, last_name, email, hashedPassword, phone, hourly_rate, prdp_expiry]
        );
        res.status(201).json({ success: true, message: "User registered successfully." });
    } catch (err) { next(err); }
};

const userLogin = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            `SELECT e.*, r.Name AS Role_Name 
             FROM Employee e 
             JOIN Role r ON e.Role_ID = r.Role_ID 
             WHERE e.Email = ?`, [email]
        );
        const employee = rows[0];
        if (!employee) return res.status(404).json({ message: "User not found." });

        let isMatch = false;
        if (employee.Password_Hash.startsWith('$2b$') || employee.Password_Hash.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(password, employee.Password_Hash);
        } else {
            isMatch = (password === employee.Password_Hash); // Safe fallback for unhashed seed records
        }

        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign(
            { employeeId: employee.Employee_ID, roleId: employee.Role_ID, warehouseId: employee.Warehouse_ID },
            process.env.JWT_SECRET_TOKEN || 'super_secret_liftex_key_2026_nwu_project',
            { expiresIn: "8h" }
        );

        res.json({
            success: true,
            token,
            user: {
                employee_id: employee.Employee_ID,
                first_name: employee.First_Name,
                last_name: employee.Last_Name,
                email: employee.Email,
                role: employee.Role_Name.toLowerCase(), // Aligns with user?.role === 'admin'
                warehouse_id: employee.Warehouse_ID
            }
        });
    } catch (err) { next(err); }
};

module.exports = { registerUser, userLogin };