const db = require('../config/db');

const dashboardController = {
        getStats: async (req, res, next) => {
        try {
            
            const [[emp]] = await db.query("SELECT COUNT(*) AS total FROM Employee;");
            const [[act]] = await db.query("SELECT COUNT(*) AS total FROM Delivery_Shift WHERE Shift_Status = 'Active';");
            const [[par]] = await db.query("SELECT COUNT(*) AS total FROM Parcel WHERE Shift_ID IN (SELECT Shift_ID FROM Delivery_Shift WHERE Shift_Date = CURDATE());");
            
            // Revenue: based on flat base charge + R35 per kilogram tariff/delivery fee since we didn't include pricing.
            const [[rev]] = await db.query(`
                SELECT IFNULL(SUM(p.Parcel_Weight * 35.00 + 120.00), 0) AS total 
                FROM Parcel p 
                JOIN Delivery_Shift s ON p.Shift_ID = s.Shift_ID 
                WHERE MONTH(s.Shift_Date) = MONTH(CURDATE()) 
                  AND YEAR(s.Shift_Date) = YEAR(CURDATE())
                  AND s.Shift_Status = 'Completed';
            `);
            
            res.json({
                totalEmployees: emp.total || 0,
                activeDeliveries: act.total || 0,
                parcelsToday: par.total || 0,
                monthlyRevenue: parseFloat(rev.total)
            });
        } catch (err) { next(err); }
    },

    // recent activity
    getRecentActivity: async (req, res, next) => {
        try {
            const sql = `
                (
                    SELECT 
                        'attendance' AS type, 
                        CONCAT(e.First_Name, ' ', e.Last_Name, ' clocked in with Odometer: ', s.Odometer_Start) AS description, 
                        s.Clock_In AS timestamp, 
                        'Driver' AS user 
                    FROM Delivery_Shift s
                    JOIN Employee e ON s.Employee_ID = e.Employee_ID
                    WHERE s.Clock_In IS NOT NULL
                )
                UNION ALL
                (
                    SELECT 
                        'delivery' AS type, 
                        CONCAT('Parcel to ', Receiver_Name, ' registered weight: ', Parcel_Weight, 'kg') AS description, 
                        s.Shift_Date AS timestamp, 
                        'Admin' AS user 
                    FROM Parcel p
                    JOIN Delivery_Shift s ON p.Shift_ID = s.Shift_ID
                )
                ORDER BY timestamp DESC 
                LIMIT 5;
            `;
            const [rows] = await db.query(sql);
            
            
            if (rows.length === 0) {
                return res.json([
                    { type: 'attendance', description: 'Database pipeline online. Awaiting operational events...', timestamp: new Date(), user: 'System' }
                ]);
            }
            
            res.json(rows);
        } catch (err) { next(err); }
    },

    
    getDeliveryTrends: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    LEFT(DAYNAME(s.Shift_Date), 3) AS date,
                    COUNT(DISTINCT s.Shift_ID) AS deliveries,
                    COUNT(p.Parcel_ID) AS parcels
                FROM Delivery_Shift s
                LEFT JOIN Parcel p ON s.Shift_ID = p.Shift_ID
                WHERE s.Shift_Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY s.Shift_Date
                ORDER BY s.Shift_Date ASC
                LIMIT 5;
            `;
            const [rows] = await db.query(sql);

            
            if (rows.length === 0) {
                return res.json([
                    { date: 'Mon', deliveries: 0, parcels: 0 },
                    { date: 'Tue', deliveries: 0, parcels: 0 },
                    { date: 'Wed', deliveries: 0, parcels: 0 },
                    { date: 'Thu', deliveries: 0, parcels: 0 },
                    { date: 'Fri', deliveries: 0, parcels: 0 }
                ]);
            }

            res.json(rows);
        } catch (err) { next(err); }
    },

    //parcel status
    getParcelStatus: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    CASE 
                        WHEN LOWER(ps.Status_Name) LIKE '%pending%' THEN 'Pending'
                        WHEN LOWER(ps.Status_Name) LIKE '%transit%' THEN 'In Transit'
                        ELSE 'Delivered'
                    END AS name,
                    COUNT(p.Parcel_ID) AS value
                FROM Parcel_Status ps
                LEFT JOIN Parcel p ON ps.Status_ID = p.Status_ID
                GROUP BY ps.Status_ID, ps.Status_Name;
            `;
            const [rows] = await db.query(sql);
            res.json(rows);
        } catch (err) { next(err); }
    }
};

module.exports = dashboardController;