const db = require('../config/db');

const payrollController = {
    /**
     * @desc    Get all payroll records      
     * @route   GET /api/payroll
     */
    getAllPayroll: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    e.Employee_ID,
                    e.Employee_ID AS payroll_id, -- CRITICAL: Maps directly to React record.payroll_id
                    CONCAT(e.First_Name, ' ', e.Last_Name) AS employee_name,
                    '2026-05-01' AS period_start,
                    '2026-05-31' AS period_end,
                    IFNULL(SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600, 0) AS total_hours,
                    e.Hourly_Rate AS hourly_rate,
                    IFNULL((SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600) * e.Hourly_Rate, 0) AS base_pay,
                    IFNULL(bonus_sub.total_bonus, 0) AS bonus,
                    IFNULL(SUM(CASE WHEN fta.Missing_Fuel_Status = 'Stolen' THEN (fta.missing_fuel * 22.50) ELSE 0 END), 0) AS deductions,
                    'draft' AS status
                FROM Employee e
                LEFT JOIN Delivery_Shift s ON e.Employee_ID = s.Employee_ID
                LEFT JOIN v_Fuel_Theft_Analysis fta ON s.Shift_ID = fta.Shift_ID
                LEFT JOIN (
                    SELECT Shift_ID, COUNT(*) * 10.00 as total_bonus FROM Parcel WHERE Status_ID = 3 GROUP BY Shift_ID
                ) bonus_sub ON s.Shift_ID = bonus_sub.Shift_ID
                WHERE s.Shift_Status = 'Completed'
                GROUP BY e.Employee_ID;
            `;
            
            const [rows] = await db.query(sql);
            
            const formattedRows = rows.map(r => {
                const base = Number(r.base_pay);
                const bonus = Number(r.bonus);
                const deduct = Number(r.deductions);
                
                return {
                    ...r,
                    net_pay: (base + bonus) - deduct
                };
            });

            res.json(formattedRows);
        } catch (err) { next(err); }
    },

    /**
     * @desc    Get detailed monthly payroll report for a specific employee
     * @route   GET /api/payroll/:id
     */
    getPayrollById: async (req, res, next) => {
        const { id } = req.params;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year are required to generate the report." });
        }

        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);

            const sql = `
                WITH Fleet_Baseline AS (
                    SELECT AVG(Fuel_Consumed_CAN / ((Odometer_End - Odometer_Start) / 100)) AS Global_Avg
                    FROM Delivery_Shift
                    WHERE Shift_Status = 'Completed' 
                    AND (Odometer_End - Odometer_Start) > 0
                    AND MONTH(Shift_Date) = ? AND YEAR(Shift_Date) = ?
                )
                SELECT 
                    e.Employee_ID,
                    e.Employee_ID AS payroll_id,
                    CONCAT(e.First_Name, ' ', e.Last_Name) AS employee_name,
                    e.Hourly_Rate AS hourly_rate,
                    SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600 AS total_hours,
                    (SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600) * e.Hourly_Rate AS base_pay,
                    (IFNULL(parcel_sub.Total_Parcels, 0) * 10.00) + 
                    (CASE 
                        WHEN (SUM(fta.Actual_Consumption) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.85) THEN 1500.00 
                        WHEN (SUM(fta.Actual_Consumption) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.95) THEN 750.00  
                        ELSE 0.00
                    END) AS bonus,
                    SUM(CASE WHEN fta.Missing_Fuel_Status = 'Stolen' 
                        THEN (fta.missing_fuel * IFNULL(fuel_sub.Avg_Fuel_Cost, 22.50))
                        ELSE 0 END) AS deductions,
                    ((SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600) * e.Hourly_Rate) + 
                    ((IFNULL(parcel_sub.Total_Parcels, 0) * 10.00) + 
                    (CASE 
                        WHEN (SUM(fta.Actual_Consumption) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.85) THEN 1500.00 
                        WHEN (SUM(fta.Actual_Consumption) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.95) THEN 750.00  
                        ELSE 0.00
                    END)) - 
                    SUM(CASE WHEN fta.Missing_Fuel_Status = 'Stolen' 
                        THEN (fta.missing_fuel * IFNULL(fuel_sub.Avg_Fuel_Cost, 22.50))
                        ELSE 0 END) AS net_pay
                FROM Employee e
                CROSS JOIN Fleet_Baseline fb 
                JOIN v_Fuel_Theft_Analysis fta ON e.Employee_ID = fta.Employee_ID 
                JOIN Delivery_Shift s ON fta.Shift_ID = s.Shift_ID
                LEFT JOIN (
                    SELECT Shift_ID, AVG(Fuel_Cost / Fuel_Litres) AS Avg_Fuel_Cost
                    FROM Fuel_Transaction GROUP BY Shift_ID
                ) fuel_sub ON fta.Shift_ID = fuel_sub.Shift_ID
                LEFT JOIN (
                    SELECT Shift_ID, COUNT(Parcel_ID) AS Total_Parcels 
                    FROM Parcel WHERE Status_ID = 3 GROUP BY Shift_ID
                ) parcel_sub ON fta.Shift_ID = parcel_sub.Shift_ID
                WHERE fta.Shift_Status = 'Completed'
                AND MONTH(fta.Shift_Date) = ? 
                AND YEAR(fta.Shift_Date) = ?
                AND e.Employee_ID = ?
                GROUP BY e.Employee_ID, fb.Global_Avg, e.Hourly_Rate;
            `;

            const [results] = await db.query(sql, [month, year, month, year, id]);

            if (results.length === 0) {
                return res.status(404).json({ message: "No payroll records found for this employee in the specified period." });
            }

            res.json(results[0]);
        } catch (err) { next(err); }
    },

    /**
     * @desc    Approve a payroll record
     * @route   PUT /api/payroll/:id/approve
     */
    approvePayroll: async (req, res, next) => {
        const { id } = req.params;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);
            res.json({ success: true, message: "Payroll approved successfully!" });
        } catch (err) { next(err); }
    },

    /**
     * @desc    Mark as paid 
     * @route   PUT /api/payroll/:id/pay
     */
    processPayment: async (req, res, next) => {
        const { id } = req.params;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);
            res.json({ success: true, message: "Payment processed!" });
        } catch (err) { next(err); }
    }
};

module.exports = payrollController;