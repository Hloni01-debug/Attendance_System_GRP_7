const { getEmployeeByEmail, createEmployee } = require("../models/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res, next) => {
    const { warehouse_id, role_id, first_name, last_name, email, phone, hourly_rate, password, prdp_expiry } = req.body;
    try {
        const existingUser = await getEmployeeByEmail(email);
        if (existingUser) return res.status(409).json({ message: "Email already exists." });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await createEmployee(warehouse_id, role_id, first_name, last_name, email, phone, hourly_rate, hashedPassword, prdp_expiry);
        res.status(201).json({ success: true, message: "User registered successfully." });
    } catch (err) { next(err); }
};

const userLogin = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await getEmployeeByEmail(email);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Changed user.Password to user.Password_Hash to match your DB column
        const isMatch = await bcrypt.compare(password, user.Password_Hash); 
        
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const accessToken = jwt.sign(
            { 
                employeeId: user.Employee_ID, 
                roleId: user.Role_ID, 
                warehouseId: user.Warehouse_ID 
            },
            process.env.JWT_SECRET_TOKEN,
            { expiresIn: "1h" }
        );

        res.json({ success: true, accessToken });
    } catch (err) { next(err); }
};

module.exports = { registerUser, userLogin };