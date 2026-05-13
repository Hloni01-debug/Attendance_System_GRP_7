
List of Create/Update queries
------------------------------------------------------------
### Create New Employee
```sql 
INSERT INTO Employee (
    Warehouse_ID, Role_ID, First_Name, Last_Name, Email, 
    Phone, Hourly_Rate, AARTO_Violations, Prdp_Expiry
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
```
### Create New Vehicle
```sql
INSERT INTO Vehicle (
    Registration_Number, Registration_Expiry, COF_Expiry, 
    Max_Payload, Make, Model, Status
) VALUES (?, ?, ?, ?, ?, ?, 'Available');
```
### Create Planned Shift
```sql
-- Trigger 13.4.2 will automatically set the vehicle to 'Reserved'
INSERT INTO Delivery_Shift (
    Employee_ID, Vehicle_ID, Start_Warehouse_ID, End_Warehouse_ID, 
    Shift_Date, Odometer_Start, Tank_Start, Shift_Status
) VALUES (?, ?, ?, ?, ?, ?, ?, 'Planned');
```
### Add Parcel to Shift
```sql
-- Trigger 13.1 blocks this if weight exceeds vehicle capacity
INSERT INTO Parcel (
    Shift_ID, Warehouse_ID, Parcel_Weight, Origin_Address, 
    Destination_Address, Receiver_Name, Status_ID
) VALUES (?, ?, ?, ?, ?, ?, 1); -- Default Status_ID 1 = 'Pending' 
```
### Record Fuel Transaction
INSERT INTO Fuel_Transaction (
    Shift_ID, Fuel_Litres, Fuel_Cost
) VALUES (?, ?, ?);

### Update Missing Fuel Status
```sql
-- need to run this to identify admin for audit log 
SET @current_user_id = ?; 

UPDATE Delivery_Shift 
SET Missing_Fuel_Status = ? -- 'Stolen' or 'Mechanical Fault' 
WHERE Shift_ID = ?;
```
### Update AARTO Points
```sql
SET @current_user_id = ?;
UPDATE Employee 
SET AARTO_Violations = ? 
WHERE Employee_ID = ?;
```
### Change hourly pay Rate
```sql
SET @current_user_id = ?;
UPDATE Employee 
SET Hourly_Rate = ? 
WHERE Employee_ID = ?;
```
### Start Shift
```sql
-- Trigger 13.4.2 automatically sets Vehicle to 'In_Use'
SET @current_user_id = ?; -- Required for Audit Log 
UPDATE Delivery_Shift 
SET Shift_Status = 'Active', Clock_In = CURRENT_TIMESTAMP 
WHERE Shift_ID = ?;
```
### End Shift
```sql
-- Trigger 13.4.2 automatically sets Vehicle to 'Available'
SET @current_user_id = ?; 
UPDATE Delivery_Shift 
SET Shift_Status = 'Completed', Clock_Out = CURRENT_TIMESTAMP 
WHERE Shift_ID = ?;
```

### Ground Vehicle for Maintenance
```sql
SET @current_user_id = ?;
UPDATE Vehicle SET Status = 'Maintenance' WHERE Vehicle_ID = ?;
```

----------------------------------------------------------
REPORT QUERIES
----------------------------------------------------------

### Driver Legal Compliance registry (lists all employee legal compliance data, their risk of license loss, and fitness for dispatch)
```sql
SELECT 
    Employee_ID, 
    Driver_Name, 
    AARTO_Violations, 
    Prdp_Expiry, 
    AARTO_Status, 
    License_Status, 
    Dispatch_Recommendation
FROM v_Driver_Compliance
WHERE Role = 'Driver'
ORDER BY AARTO_Violations DESC, Prdp_Expiry ASC;
```
### Full fleet Roadworthiness Registry
```sql
SELECT 
    Vehicle_ID,
    Registration_Number,
    Registration_Expiry,
    COF_Expiry,
    License_Status,
    Roadworthy_Status,
    Vehicle_Readiness
FROM v_Vehicle_Compliance
ORDER BY 
    -- Sorts Grounded(i.e. in maintenance) vehicles to the top, then by nearest expiry
    CASE WHEN Vehicle_Readiness = 'GROUNDED' THEN 1 ELSE 2 END, 
    Registration_Expiry ASC;
```

### Detailed single-vehicle Roadworthiness report
```sql
SELECT 
    Vehicle_ID,
    Registration_Number,
    Make,
    Model,
    Max_Payload,
    Registration_Expiry,
    COF_Expiry,
    License_Status,
    Roadworthy_Status,
    Vehicle_Readiness,
    Current_Status
FROM v_Vehicle_Compliance
WHERE Vehicle_ID =?; 
```

### Frontend Query run to dispay to driver if/why their shift application failed or 
```sql
SELECT 
    Employee_ID,

    -- will give true or false for Is_expired or Is_suspended
    (License_Status = 'EXPIRED') AS Is_Expired,
    (AARTO_Status = 'SUSPENDED') AS Is_Suspended,
    
    -- The result seen from user interface(e.g. 'do not assign')
    CASE 
        WHEN Role_ID != 1 THEN 'Blocked: Unauthorized Role' -- Role must be a driver
        WHEN Dispatch_Recommendation = 'DO NOT ASSIGN' THEN 'Registration Blocked: Legal Compliance Failure'
        WHEN Dispatch_Recommendation = 'MANAGEMENT REVIEW REQ' THEN 'Pending: Managerial Approval Required'
        ELSE 'Clear to Start'
    END AS Registration_Status
FROM v_Driver_Compliance
WHERE Employee_ID = ?;
```
### Employee Monthly Audit (generates report data for each of a specific employee's shifts in a specific month and year)
```sql
SELECT 
    s.Shift_ID,
    s.Shift_Date,
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Driver,
    v.Registration_Number,

    -- 1. Odometer distance
    (s.Odometer_End - s.Odometer_Start) AS `Distance_Travelled(km)`,
    
    -- 2. Fuel Cost
    (s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) AS `Missing_Fuel(L)`,
    ((s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) 
     * IFNULL(fuel_sub.Avg_Unit_Price, 0)) AS `Fuel_Loss_Cost(R)`,
    
    -- 3. Parcel Productivity (New: Count)
    IFNULL(parcel_sub.Parcel_Count, 0) AS `Parcels_Delivered`,

    -- 4. Payload/Weight monitoring
    v.Max_Payload,
    IFNULL(parcel_sub.Total_Weight, 0) AS `Current_Load(kg)`,
    (v.Max_Payload - IFNULL(parcel_sub.Total_Weight, 0)) AS `Remaining_Capacity(kg)`,
    
    -- 5. Statuses
    s.Missing_Fuel_Status,
    s.Shift_Status

FROM Delivery_Shift s
JOIN Employee e ON s.Employee_ID = e.Employee_ID
JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID
LEFT JOIN (
    SELECT 
        Shift_ID, 
        SUM(Fuel_Litres) AS Total_Refills,
        AVG(Fuel_Cost / Fuel_Litres) AS Avg_Unit_Price 
    FROM Fuel_Transaction 
    GROUP BY Shift_ID
) fuel_sub ON s.Shift_ID = fuel_sub.Shift_ID 
LEFT JOIN (
    SELECT 
        Shift_ID, 
        SUM(Parcel_Weight) AS Total_Weight,
        COUNT(Parcel_ID) AS Parcel_Count 
    FROM Parcel 
    GROUP BY Shift_ID
) parcel_sub ON s.Shift_ID = parcel_sub.Shift_ID
WHERE MONTH(s.Shift_Date) = ? 
  AND YEAR(s.Shift_Date) = ?
  AND s.Employee_ID = ?
ORDER BY s.Shift_Date DESC; 
```

### Single Shift Summary (Generates report data for a specific shift) 
```sql
SELECT 
    s.Shift_ID,
    s.Shift_Date,
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Driver,
    v.Registration_Number,
    -- 1. Operational Results
    (s.Odometer_End - s.Odometer_Start) AS `Total_Distance(km)`,
    (s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) AS `Missing_Fuel(L)`,
    ((s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) 
     * IFNULL(fuel_sub.Avg_Unit_Price, 0)) AS `Fuel_Loss_Cost(R)`,
    
    -- 2. Parcel Info (Count + Weight)
    IFNULL(parcel_sub.Parcel_Count, 0) AS `Total_Parcels`,
    v.Max_Payload,
    IFNULL(parcel_sub.Total_Weight, 0) AS `Actual_Load(kg)`,
    (v.Max_Payload - IFNULL(parcel_sub.Total_Weight, 0)) AS `Load_Margin(kg)`,
    
    -- 3. Audit Statuses
    s.Missing_Fuel_Status,
    s.Shift_Status
FROM Delivery_Shift s
JOIN Employee e ON s.Employee_ID = e.Employee_ID
JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID
LEFT JOIN (
    SELECT 
        Shift_ID, 
        SUM(Fuel_Litres) AS Total_Refills, 
        AVG(Fuel_Cost / Fuel_Litres) AS Avg_Unit_Price
    FROM Fuel_Transaction 
    GROUP BY Shift_ID
) fuel_sub ON s.Shift_ID = fuel_sub.Shift_ID 
LEFT JOIN (
    SELECT 
        Shift_ID, 
        SUM(Parcel_Weight) AS Total_Weight,
        COUNT(Parcel_ID) AS Parcel_Count
    FROM Parcel 
    GROUP BY Shift_ID
) parcel_sub ON s.Shift_ID = parcel_sub.Shift_ID
WHERE s.Shift_ID = ?; 
```

### Monthly Attendance Report (Generates list of employee attendance based on Hours worked, warehouse checked in at etc)
```sql
SELECT 
    s.Shift_ID,
    s.Shift_Date,
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Driver,
    s.Clock_In,
    -- 1. Where they checked in
    w1.Name AS Starting_Warehouse,
    
    -- 2. Display logic for uncompleted shifts
    IFNULL(w2.Name, 'In Transit (Not Checked Out)') AS Ending_Warehouse,
    
    -- 3. Only show a duration if they have actually finished
    IF(s.Clock_Out IS NULL, 'Shift Active', TIMEDIFF(s.Clock_Out, s.Clock_In)) AS `Shift_Duration`,
    
    s.Shift_Status
FROM Delivery_Shift s
JOIN Employee e ON s.Employee_ID = e.Employee_ID
JOIN Warehouse w1 ON s.Start_Warehouse_ID = w1.Warehouse_ID

LEFT JOIN Warehouse w2 ON s.End_Warehouse_ID = w2.Warehouse_ID
WHERE MONTH(s.Shift_Date) = ? 
  AND YEAR(s.Shift_Date) = ?
  AND s.Employee_ID = ?
ORDER BY s.Shift_Date DESC;
```

### Monthly employee overall summary (generates summarised overview of Employee's monthly profile: Parcels delivered, hours work, total distance etc)
```sql
### Monthly employee overall summary 
SELECT 
    s.Employee_ID,
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Driver,
    
    -- 1. Counting variouous shift statuses
    COUNT(CASE WHEN s.Shift_Status = 'Completed' THEN 1 END) AS Shifts_Completed,
    COUNT(CASE WHEN s.Shift_Status = 'Cancelled' THEN 1 END) AS Shifts_Cancelled,
    COUNT(CASE WHEN s.Shift_Status = 'Active' THEN 1 END) AS Shifts_Still_Active,
    COUNT(CASE WHEN s.Shift_Status = 'Planned' THEN 1 END) AS Shifts_Still_Planned,

    -- 2. total parcels delivered
    SUM(CASE WHEN s.Shift_Status = 'Completed' THEN IFNULL(parcel_sub.Parcel_Count, 0) ELSE 0 END) AS Total_Parcels_Delivered,

    -- 3. Billable Labor (in HH:MM:SS format)
    SEC_TO_TIME(SUM(
        CASE WHEN s.Shift_Status = 'Completed' 
             AND s.Clock_In IS NOT NULL 
             AND s.Clock_Out IS NOT NULL 
        THEN TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out) 
        ELSE 0 END
    )) AS Total_Billable_Hours,

    -- 4. Billable Distance
    SUM(
        CASE WHEN s.Shift_Status = 'Completed' 
        THEN (s.Odometer_End - s.Odometer_Start) 
        ELSE 0 END
    ) AS `Total_Billable_Distance(KM)`,

    -- 5. Net Fuel Usage (actual Physical tank depletion)
    SUM(CASE WHEN s.Shift_Status = 'Completed' 
        THEN (s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Tank_End) 
        ELSE 0 END) AS `Net_Fuel_Usage(L)`,

    -- 6. Total Missing Fuel 
    SUM(CASE WHEN s.Shift_Status = 'Completed' 
        THEN (s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) 
        ELSE 0 END) AS `Total_Missing_Fuel(L)`,

    -- 7. Total Missing Fuel Theft (only for 'Stolen' incidents)
    SUM(CASE WHEN s.Shift_Status = 'Completed' AND s.Missing_Fuel_Status = 'Stolen'
        THEN (s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) 
        ELSE 0 END) AS `Total_Missing_Fuel_Theft(L)`,

    -- 8. Final Fuel Deductions (Financial value of stolen liters)
    SUM(
        CASE WHEN s.Shift_Status = 'Completed' AND s.Missing_Fuel_Status = 'Stolen'
        THEN ((s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) * IFNULL(fuel_sub.Avg_Fuel_Cost, 0))
        ELSE 0 END
    ) AS `Total_Theft_Deduction(R)`

FROM Delivery_Shift s
JOIN Employee e ON s.Employee_ID = e.Employee_ID

LEFT JOIN (
    SELECT Shift_ID, SUM(Fuel_Litres) AS Total_Refills, AVG(Fuel_Cost / Fuel_Litres) AS Avg_Fuel_Cost
    FROM Fuel_Transaction GROUP BY Shift_ID
) fuel_sub ON s.Shift_ID = fuel_sub.Shift_ID

LEFT JOIN (
    SELECT Shift_ID, COUNT(Parcel_ID) AS Parcel_Count 
    FROM Parcel 
    WHERE Status_ID = 3 
    GROUP BY Shift_ID
) parcel_sub ON s.Shift_ID = parcel_sub.Shift_ID

WHERE MONTH(s.Shift_Date) = ? AND YEAR(s.Shift_Date) = ? AND s.Employee_ID = ?
GROUP BY s.Employee_ID;
```

### Monthly payroll for one employee
```sql
WITH Fleet_Baseline AS (
    -- 1. fleet average in L/100km for this specific month/year
    SELECT 
        AVG(Fuel_Consumed_CAN / ((Odometer_End - Odometer_Start) / 100)) AS Global_Avg
    FROM Delivery_Shift
    WHERE Shift_Status = 'Completed' 
      AND (Odometer_End - Odometer_Start) > 0
      AND MONTH(Shift_Date) = ? AND YEAR(Shift_Date) = ?
)
SELECT 
    e.Employee_ID,
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Driver_Name,
    
    -- 2. Gross Pay
    (SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600) * e.Hourly_Rate AS Gross_Base_Pay,
    
    -- 3. Parcel Bonus (R10.00 per parcel)
    IFNULL(parcel_sub.Total_Parcels, 0) * 10.00 AS Parcel_Bonus,

    -- 4. Driver individual fuel efficiency for that month (L/100KM)
    (SUM(s.Fuel_Consumed_CAN) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) AS Driver_Avg_Efficiency,

    -- 5. Fuel Efficiency Bonus evaluated to tiered system based on comparison to to Fleet_Baseline)
    CASE 
        WHEN (SUM(s.Fuel_Consumed_CAN) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.85) THEN 1500.00 -- < 15% of fleet average fuel efficiency  
        WHEN (SUM(s.Fuel_Consumed_CAN) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.95) THEN 750.00  -- < 5% of fleet avg efficiency
        ELSE 0.00
    END AS Efficiency_Bonus,

    -- 6. Total Stolen Fuel Deductions
    SUM(CASE WHEN s.Missing_Fuel_Status = 'Stolen' 
        THEN ((s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) * IFNULL(fuel_sub.Avg_Fuel_Cost, 0))
        ELSE 0 END) AS Total_Deductions,

    -- 7. Net Pay Calculation
    (((SUM(TIMESTAMPDIFF(SECOND, s.Clock_In, s.Clock_Out)) / 3600) * e.Hourly_Rate) -- gross pay
    + (IFNULL(parcel_sub.Total_Parcels, 0) * 10.00) -- Parcels bonus
    + (CASE 
        WHEN (SUM(s.Fuel_Consumed_CAN) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.85) THEN 1500.00 
        WHEN (SUM(s.Fuel_Consumed_CAN) / (SUM(s.Odometer_End - s.Odometer_Start) / 100)) < (fb.Global_Avg * 0.95) THEN 750.00  
        ELSE 0.00
      END) -- Bonus
    - SUM(CASE WHEN s.Missing_Fuel_Status = 'Stolen' 
        THEN ((s.Tank_Start + IFNULL(fuel_sub.Total_Refills, 0) - s.Fuel_Consumed_CAN - s.Tank_End) * IFNULL(fuel_sub.Avg_Fuel_Cost, 0))
        ELSE 0 END)) -- DeductionS
    AS Net_Final_Pay

FROM Employee e
CROSS JOIN Fleet_Baseline fb 
JOIN Delivery_Shift s ON e.Employee_ID = s.Employee_ID
LEFT JOIN (
    SELECT Shift_ID, SUM(Fuel_Litres) AS Total_Refills, AVG(Fuel_Cost / Fuel_Litres) AS Avg_Fuel_Cost
    FROM Fuel_Transaction GROUP BY Shift_ID
) fuel_sub ON s.Shift_ID = fuel_sub.Shift_ID
-- Inside "Monthly payroll for one employee"
LEFT JOIN (
    SELECT Shift_ID, COUNT(Parcel_ID) AS Total_Parcels 
    FROM Parcel 
    WHERE Status_ID = 3 -- parcel bonus only applied to 'Delivered' parcels
    GROUP BY Shift_ID
) parcel_sub ON s.Shift_ID = parcel_sub.Shift_ID

WHERE s.Shift_Status = 'Completed'
  AND MONTH(s.Shift_Date) = ? 
  AND YEAR(s.Shift_Date) = ?
  AND e.Employee_ID = ?
GROUP BY e.Employee_ID, fb.Global_Avg;
```


### Showing all 'Available' Vehicles
```sql
SELECT 
    Vehicle_ID, Registration_Number, Make, Model, Max_Payload, 
    Current_Status  
FROM v_Vehicle_Compliance
WHERE Current_Status = 'Available' 
  AND Vehicle_Readiness = 'FIT FOR DISPATCH'
ORDER BY Max_Payload DESC;
```

### Showing all 'Reserved' vehicles
```sql
SELECT 
    v.Registration_Number,
    e.First_Name AS Planned_Driver,
    s.Shift_Date,
    s.Start_Warehouse_ID
FROM Vehicle v
JOIN Delivery_Shift s ON v.Vehicle_ID = s.Vehicle_ID
JOIN Employee e ON s.Employee_ID = e.Employee_ID
WHERE v.Status = 'Reserved' 
  AND s.Shift_Status = 'Planned';
``` 

### Full fleet status overview (%of vehicle in specific status)
```sql
SELECT 
    Status,
    COUNT(Vehicle_ID) AS Total_Vehicles,
    ROUND(COUNT(Vehicle_ID) * 100.0 / (SELECT COUNT(*) FROM Vehicle), 1) AS Percentage_of_Fleet
FROM Vehicle
GROUP BY Status;
```

 
