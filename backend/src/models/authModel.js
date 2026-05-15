import pool from "../config/db.js";

export const getEmployeeByEmail = async (email) => {
    const result = await pool.query(
        `SELECT * FROM Employee WHERE Email = $1`,
        [email]
    );

    return result.rows[0];
};
export const createEmployee = async (
    warehouseId,
    roleId,
    firstName,
    lastName,
    email,
    phone,
    hourlyRate,
    prdpExpiry
) => {
    const result = await pool.query(
        `INSERT INTO Employee 
        (Warehouse_ID, Role_ID, First_Name, Last_Name, Email, Phone, Hourly_Rate, Prdp_Expiry)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            warehouseId,
            roleId,
            firstName,
            lastName,
            email,
            phone,
            hourlyRate,
            prdpExpiry
        ]
    );

    return result.rows[0];
};