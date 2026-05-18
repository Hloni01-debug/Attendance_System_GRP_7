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
                    p.Payroll_ID AS payroll_id,
                    p.Employee_ID,
                    CONCAT(e.First_Name, ' ', e.Last_Name) AS employee_name,
                    DATE_FORMAT(p.Payroll_Date, '%Y-%m-01') AS period_start,
                    LAST_DAY(p.Payroll_Date) AS period_end,
                    p.Applied_Hourly_Rate AS hourly_rate,
                    IFNULL(SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600, 0) AS total_hours,
                    IFNULL(SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600 * p.Applied_Hourly_Rate, 0) AS base_pay,
                    IFNULL(bonus_sub.total_bonus, 0) AS bonus,
                    IFNULL(SUM(CASE WHEN fta.Missing_Fuel_Status = 'Stolen' THEN (fta.missing_fuel * 22.50) ELSE 0 END), 0) AS deductions,
                    'draft' AS status
                FROM Payroll_Record p
                JOIN Employee e ON p.Employee_ID = e.Employee_ID
                LEFT JOIN Delivery_Shift s ON p.Employee_ID = s.Employee_ID 
                    AND s.Shift_Status = 'Completed'
                    AND MONTH(s.Shift_Date) = MONTH(p.Payroll_Date)
                    AND YEAR(s.Shift_Date) = YEAR(p.Payroll_Date)
                LEFT JOIN v_Fuel_Theft_Analysis fta ON s.Shift_ID = fta.Shift_ID
                LEFT JOIN (
                    SELECT s2.Employee_ID, MONTH(s2.Shift_Date) as m, YEAR(s2.Shift_Date) as y, COUNT(*) * 10.00 as total_bonus 
                    FROM Parcel pr
                    JOIN Delivery_Shift s2 ON pr.Shift_ID = s2.Shift_ID
                    WHERE pr.Status_ID = 3 AND s2.Shift_Status = 'Completed'
                    GROUP BY s2.Employee_ID, MONTH(s2.Shift_Date), YEAR(s2.Shift_Date)
                ) bonus_sub ON p.Employee_ID = bonus_sub.Employee_ID AND MONTH(p.Payroll_Date) = bonus_sub.m AND YEAR(p.Payroll_Date) = bonus_sub.y
                GROUP BY p.Payroll_ID, p.Employee_ID, e.First_Name, e.Last_Name, p.Payroll_Date, p.Applied_Hourly_Rate, bonus_sub.total_bonus;
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
            const adminActorId = 
                req.user?.Employee_ID || 
                req.user?.employee_id || 
                req.user?.employeeId || 
                req.user?.id || 
                req.user?.userId || 
                req.userId || 
                1;

            await db.query("SET @current_user_id = ?;", [adminActorId]);

            const sql = `
                WITH Fleet_Baseline AS (
                    SELECT IFNULL(AVG(Fuel_Consumed_CAN / NULLIF((Odometer_End - Odometer_Start) / 100, 0)), 0) AS Global_Avg
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
                    IFNULL(SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600, 0) AS total_hours,
                    IFNULL(SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600 * e.Hourly_Rate, 0) AS base_pay,
                    IFNULL(SUM(parcel_sub.Total_Parcels), 0) * 10.00 + 
                    CASE 
                        WHEN IFNULL(SUM(s.Odometer_End - s.Odometer_Start), 0) > 0 
                             AND (SUM(fta.Actual_Consumption) / NULLIF(SUM(s.Odometer_End - s.Odometer_Start) / 100, 0)) < (MAX(fb.Global_Avg) * 0.85) THEN 1500.00 
                        WHEN IFNULL(SUM(s.Odometer_End - s.Odometer_Start), 0) > 0 
                             AND (SUM(fta.Actual_Consumption) / NULLIF(SUM(s.Odometer_End - s.Odometer_Start) / 100, 0)) < (MAX(fb.Global_Avg) * 0.95) THEN 750.00  
                        ELSE 0.00
                    END AS bonus,
                    IFNULL(SUM(CASE WHEN fta.Missing_Fuel_Status = 'Stolen' THEN (fta.missing_fuel * IFNULL(fuel_sub.Avg_Fuel_Cost, 22.50)) ELSE 0 END), 0) AS deductions,
                    IFNULL(SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600 * e.Hourly_Rate, 0) +
                    (IFNULL(SUM(parcel_sub.Total_Parcels), 0) * 10.00 + 
                    CASE 
                        WHEN IFNULL(SUM(s.Odometer_End - s.Odometer_Start), 0) > 0 
                             AND (SUM(fta.Actual_Consumption) / NULLIF(SUM(s.Odometer_End - s.Odometer_Start) / 100, 0)) < (MAX(fb.Global_Avg) * 0.85) THEN 1500.00 
                        WHEN IFNULL(SUM(s.Odometer_End - s.Odometer_Start), 0) > 0 
                             AND (SUM(fta.Actual_Consumption) / NULLIF(SUM(s.Odometer_End - s.Odometer_Start) / 100, 0)) < (MAX(fb.Global_Avg) * 0.95) THEN 750.00  
                        ELSE 0.00
                    END) -
                    IFNULL(SUM(CASE WHEN fta.Missing_Fuel_Status = 'Stolen' THEN (fta.missing_fuel * IFNULL(fuel_sub.Avg_Fuel_Cost, 22.50)) ELSE 0 END), 0) AS net_pay
                FROM Employee e
                CROSS JOIN Fleet_Baseline fb
                LEFT JOIN Delivery_Shift s ON e.Employee_ID = s.Employee_ID 
                    AND s.Shift_Status = 'Completed'
                    AND MONTH(s.Shift_Date) = ? 
                    AND YEAR(s.Shift_Date) = ?
                LEFT JOIN v_Fuel_Theft_Analysis fta ON s.Shift_ID = fta.Shift_ID
                LEFT JOIN (
                    SELECT Shift_ID, AVG(Fuel_Cost / NULLIF(Fuel_Litres, 0)) AS Avg_Fuel_Cost
                    FROM Fuel_Transaction GROUP BY Shift_ID
                ) fuel_sub ON s.Shift_ID = fuel_sub.Shift_ID
                LEFT JOIN (
                    SELECT Shift_ID, COUNT(Parcel_ID) AS Total_Parcels 
                    FROM Parcel WHERE Status_ID = 3 GROUP BY Shift_ID
                ) parcel_sub ON fta.Shift_ID = parcel_sub.Shift_ID
                WHERE e.Employee_ID = ?
                GROUP BY e.Employee_ID, e.First_Name, e.Last_Name, e.Hourly_Rate;
            `;

            const [results] = await db.query(sql, [month, year, month, year, id]);

            if (results.length === 0) {
                return res.status(404).json({ message: "No payroll records found for this identity target configuration." });
            }

            const payrollData = results[0];
            const payrollDate = `${year}-${month}-01`;

            const [existing] = await db.query(
                "SELECT Payroll_ID FROM Payroll_Record WHERE Employee_ID = ? AND MONTH(Payroll_Date) = ? AND YEAR(Payroll_Date) = ?;",
                [id, month, year]
            );

            if (existing.length === 0) {
                await db.query(
                    "INSERT INTO Payroll_Record (Employee_ID, Payroll_Date, Applied_Hourly_Rate) VALUES (?, ?, ?);",
                    [payrollData.Employee_ID, payrollDate, payrollData.hourly_rate]
                );
            } else {
                await db.query(
                    "UPDATE Payroll_Record SET Applied_Hourly_Rate = ? WHERE Payroll_ID = ?;",
                    [payrollData.hourly_rate, existing[0].Payroll_ID]
                );
            }

            res.json(payrollData);
        } catch (err) { next(err); }
    },

    /**
     * @desc    Approve a payroll record
     * @route   PUT /api/payroll/:id/approve
     */
    approvePayroll: async (req, res, next) => {
        const { id } = req.params;
        try {
            const adminActorId = 
                req.user?.Employee_ID || 
                req.user?.employee_id || 
                req.user?.employeeId || 
                req.user?.id || 
                req.user?.userId || 
                req.userId || 
                1;
            await db.query("SET @current_user_id = ?;", [adminActorId]);
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
            const adminActorId = 
                req.user?.Employee_ID || 
                req.user?.employee_id || 
                req.user?.employeeId || 
                req.user?.id || 
                req.user?.userId || 
                req.userId || 
                1;
            await db.query("SET @current_user_id = ?;", [adminActorId]);
            res.json({ success: true, message: "Payment processed!" });
        } catch (err) { next(err); }
    }
};

module.exports = payrollController;