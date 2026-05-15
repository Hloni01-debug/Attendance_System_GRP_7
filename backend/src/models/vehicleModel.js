import pool from "../config/db.js"


export const getAllVehicles = async () => {
    const result = await pool.query(`
        SELECT * FROM Vehicle
    `)
    return result.rows
}


export const getVehicleById = async (id) => {
    const result = await pool.query(`
        SELECT * FROM Vehicle
        WHERE Vehicle_ID = $1
    `, [id])

    return result.rows[0]
}


export const createVehicle = async (
    registrationNumber,
    registrationExpiry,
    cofExpiry,
    maxPayload,
    make,
    model,
    status = "Available"
) => {
    const result = await pool.query(`
        INSERT INTO Vehicle
        (Registration_Number, Registration_Expiry, COF_Expiry, Max_Payload, Make, Model, Status)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
    `, [
        registrationNumber,
        registrationExpiry,
        cofExpiry,
        maxPayload,
        make,
        model,
        status
    ])

    return result.rows[0]
}


export const updateVehicleStatus = async (id, status) => {
    const result = await pool.query(`
        UPDATE Vehicle
        SET Status = $1
        WHERE Vehicle_ID = $2
        RETURNING *
    `, [status, id])

    return result.rows[0]
}


export const deleteVehicleById = async (id) => {
    const result = await pool.query(`
        DELETE FROM Vehicle
        WHERE Vehicle_ID = $1
        RETURNING *
    `, [id])

    return result.rows[0]
}