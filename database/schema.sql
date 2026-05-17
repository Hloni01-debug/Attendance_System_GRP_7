CREATE DATABASE IF NOT EXISTS liftex_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE liftex_db;

-- 1. WAREHOUSE
CREATE TABLE IF NOT EXISTS Warehouse (
  Warehouse_ID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Name           VARCHAR(255) NOT NULL,
  Street         VARCHAR(255),
  City           VARCHAR(255),
  Province       VARCHAR(100),
  Contact_Number VARCHAR(50)
) ENGINE=InnoDB;

-- 2. ROLE
CREATE TABLE IF NOT EXISTS Role (
  Role_ID        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Name           VARCHAR(50) NOT NULL, 
  Description    VARCHAR(200)
) ENGINE=InnoDB;

-- 3. EMPLOYEE
CREATE TABLE IF NOT EXISTS Employee (
  Employee_ID    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Warehouse_ID   INT UNSIGNED NOT NULL,
  Role_ID        INT UNSIGNED NOT NULL,
  First_Name     VARCHAR(255) NOT NULL,
  Last_Name      VARCHAR(255) NOT NULL,
  Email          VARCHAR(255) NOT NULL UNIQUE,
  Password_Hash  VARCHAR(255) NOT NULL,
  Phone          VARCHAR(20), 
  Hourly_Rate    DECIMAL(10,2) NOT NULL, 
  AARTO_Violations INT DEFAULT 0,
  Prdp_Expiry    DATE,
  Created_At     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Updated_At     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_wh FOREIGN KEY (Warehouse_ID) REFERENCES Warehouse(Warehouse_ID),
  CONSTRAINT fk_emp_role FOREIGN KEY (Role_ID) REFERENCES Role(Role_ID)
) ENGINE=InnoDB;

-- 4. VEHICLE
CREATE TABLE IF NOT EXISTS Vehicle (
  Vehicle_ID          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Registration_Number VARCHAR(20) NOT NULL UNIQUE,
  Registration_Expiry DATE,
  COF_Expiry          DATE,
  Max_Payload         DECIMAL(10,2) NOT NULL,
  Make                VARCHAR(200),
  Model               VARCHAR(200),
  Status              ENUM('Available', 'In_Use', 'Maintenance', 'Reserved') DEFAULT 'Available'
) ENGINE=InnoDB;

-- 5. DELIVERY_SHIFT
CREATE TABLE IF NOT EXISTS Delivery_Shift (
  Shift_ID           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Employee_ID        INT UNSIGNED NOT NULL,
  Vehicle_ID         INT UNSIGNED NOT NULL,
  Start_Warehouse_ID INT UNSIGNED NOT NULL, 
  End_Warehouse_ID   INT UNSIGNED NOT NULL,
  Shift_Date         DATE NOT NULL,
  Clock_In           TIMESTAMP NULL, 
  Clock_Out          TIMESTAMP NULL,
  Odometer_Start     DECIMAL(10,2) NOT NULL, 
  Odometer_End       DECIMAL(10,2),
  Tank_Start         DECIMAL(10,2) NOT NULL, 
  Tank_End           DECIMAL(10,2),
  Fuel_Consumed_CAN  DECIMAL(10,2), 
  Missing_Fuel_Status ENUM('None', 'Stolen', 'Mechanical Fault') DEFAULT 'None', 
  Shift_Status       ENUM('Planned', 'Active', 'Completed', 'Cancelled') DEFAULT 'Planned', 
  CONSTRAINT fk_shift_emp FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID),
  CONSTRAINT fk_shift_veh FOREIGN KEY (Vehicle_ID) REFERENCES Vehicle(Vehicle_ID),
  CONSTRAINT fk_shift_start_wh FOREIGN KEY (Start_Warehouse_ID) REFERENCES Warehouse(Warehouse_ID),
  CONSTRAINT fk_shift_end_wh FOREIGN KEY (End_Warehouse_ID) REFERENCES Warehouse(Warehouse_ID)
) ENGINE=InnoDB;

-- 7 Parcel_Status
CREATE TABLE IF NOT EXISTS Parcel_Status (
  Status_ID          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Status_Name        VARCHAR(100) NOT NULL, -- e.g., 'Pending'
  Status_Description VARCHAR(255)
) ENGINE=InnoDB;

-- 8. PARCEL
CREATE TABLE IF NOT EXISTS Parcel (
  Parcel_ID           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Shift_ID            INT UNSIGNED,
  Warehouse_ID        INT UNSIGNED NOT NULL,
  Parcel_Weight       DECIMAL(10,2) NOT NULL, 
  Origin_Address      VARCHAR(100),
  Destination_Address VARCHAR(100),
  Receiver_Name       VARCHAR(100),
  Status_ID           INT UNSIGNED DEFAULT 1, 
  CONSTRAINT fk_parcel_shift FOREIGN KEY (Shift_ID) REFERENCES Delivery_Shift(Shift_ID) ON DELETE SET NULL,
  CONSTRAINT fk_parcel_wh FOREIGN KEY (Warehouse_ID) REFERENCES Warehouse(Warehouse_ID),
  CONSTRAINT fk_parcel_status FOREIGN KEY (Status_ID) REFERENCES Parcel_Status(Status_ID) 
) ENGINE=InnoDB;
-- 9. FUEL_TRANSACTION
CREATE TABLE IF NOT EXISTS Fuel_Transaction (
  Fuel_Transaction_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Shift_ID            INT UNSIGNED NOT NULL,
  Fuel_Litres         DECIMAL(10,2) NOT NULL,
  Fuel_Cost           DECIMAL(10,2) NOT NULL, 
  CONSTRAINT fk_fuel_shift FOREIGN KEY (Shift_ID) REFERENCES Delivery_Shift(Shift_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. PAYROLL_RECORD
CREATE TABLE IF NOT EXISTS Payroll_Record (
  Payroll_ID          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Employee_ID         INT UNSIGNED NOT NULL,
  Payroll_Date        DATE NOT NULL, 
  Applied_Hourly_Rate DECIMAL(10,2) NOT NULL, 
  CONSTRAINT fk_pay_emp FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. AUDIT_LOG
CREATE TABLE IF NOT EXISTS Audit_Log (
  Log_ID           INT UNSIGNED AUTO_INCREMENT,
  Employee_ID      INT UNSIGNED NOT NULL, -- THE ADMIN: The person who "generates" the log
  Action_Type      VARCHAR(50) NOT NULL, 
  Table_Affected   VARCHAR(50),
  Action_Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Old_Value        VARCHAR(200), -- will also add ID's here of the changed tables
  New_Value        VARCHAR(200),
  -- Composite Primary Key as specified in Logical Design
  PRIMARY KEY (Log_ID, Employee_ID), 
  -- Strong relationship link back to Employee table, following phase 2 doc
  CONSTRAINT fk_audit_emp_actor FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. VIEW: Driver Legal Compliance (Updated)
CREATE VIEW v_Driver_Compliance AS
SELECT 
    e.Employee_ID,
    e.Role_ID, 
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Driver_Name,
    e.Email,
    e.Phone AS Contact_Number, 
    e.Prdp_Expiry,
    e.AARTO_Violations,
    r.Name AS Role, 

    CASE 
        WHEN e.AARTO_Violations >= 15 THEN 'SUSPENDED'
        WHEN e.AARTO_Violations >= 12 THEN 'CRITICAL'
        WHEN e.AARTO_Violations >= 8  THEN 'WARNING'
        ELSE 'CLEAR'
    END AS AARTO_Status,

    CASE 
        WHEN e.Prdp_Expiry < CURRENT_DATE THEN 'EXPIRED'
        WHEN e.Prdp_Expiry <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'RENEWAL DUE'
        ELSE 'VALID'
    END AS License_Status,

    CASE 
        WHEN e.AARTO_Violations >= 15 OR e.Prdp_Expiry < CURRENT_DATE THEN 'DO NOT ASSIGN'
        WHEN e.AARTO_Violations >= 12 THEN 'MANAGEMENT REVIEW REQ'
        ELSE 'APPROVED'
    END AS Dispatch_Recommendation
FROM Employee e
JOIN Role r ON e.Role_ID = r.Role_ID;

-- 13. VIEW: Vehicle Legal Compliance
CREATE VIEW v_Vehicle_Compliance AS
SELECT 
    Vehicle_ID,
    Registration_Number,
    Make, 
    Model, 
    Max_Payload,
    Registration_Expiry,
    COF_Expiry,
    Status AS Current_Status, 

    CASE 
        WHEN Registration_Expiry < CURRENT_DATE THEN 'EXPIRED'
        WHEN Registration_Expiry <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'RENEWAL DUE'
        ELSE 'VALID'
    END AS License_Status,

    CASE 
        WHEN COF_Expiry < CURRENT_DATE THEN 'UNROADWORTHY'
        WHEN COF_Expiry <= DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY) THEN 'TEST REQUIRED'
        ELSE 'VALID'
    END AS Roadworthy_Status,

    CASE 
        WHEN Registration_Expiry < CURRENT_DATE OR COF_Expiry < CURRENT_DATE THEN 'GROUNDED'
        WHEN Registration_Expiry <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) THEN 'PRIORITIZE RENEWAL'
        WHEN Status = 'Maintenance' THEN 'IN REPAIR'
        ELSE 'FIT FOR DISPATCH'
    END AS Vehicle_Readiness
FROM Vehicle;

-- 14. VIEW: Fuel Theft Analysis
CREATE OR REPLACE VIEW v_Fuel_Theft_Analysis AS
SELECT 
    s.Shift_ID,
    s.Employee_ID,          
    e.First_Name AS Driver_Name,
    s.Shift_Date,
    s.Shift_Status,
    s.Odometer_End - s.Odometer_Start AS Distance_Travelled,
    s.Tank_Start + IFNULL(ft.Total_Refuel, 0) - s.Tank_End AS Actual_Consumption,
    s.Fuel_Consumed_CAN AS Expected_Consumption,
    -- The Logic Specialist's math:
    (s.Tank_Start + IFNULL(ft.Total_Refuel, 0) - s.Tank_End) - s.Fuel_Consumed_CAN AS missing_fuel,
    s.Missing_Fuel_Status
FROM Delivery_Shift s
JOIN Employee e ON s.Employee_ID = e.Employee_ID
LEFT JOIN (
    SELECT Shift_ID, SUM(Fuel_Litres) AS Total_Refuel
    FROM Fuel_Transaction
    GROUP BY Shift_ID
) ft ON s.Shift_ID = ft.Shift_ID;

-- 15 Triggers
 
-- 15.1 Payload Enforcement Trigger (prevents parcel INSERT into SHIFT if it exceeds the vehicle's maximum payload)

DELIMITER //

CREATE TRIGGER check_max_payload_before_insert
BEFORE INSERT ON Parcel
FOR EACH ROW
BEGIN
    DECLARE current_total_weight DECIMAL(10,2);
    DECLARE vehicle_max_capacity DECIMAL(10,2);

    SELECT IFNULL(SUM(Parcel_Weight), 0) INTO current_total_weight
    FROM Parcel WHERE Shift_ID = NEW.Shift_ID;

    SELECT v.Max_Payload INTO vehicle_max_capacity
    FROM Vehicle v
    JOIN Delivery_Shift s ON v.Vehicle_ID = s.Vehicle_ID
    WHERE s.Shift_ID = NEW.Shift_ID;

    IF (current_total_weight + NEW.Parcel_Weight) > vehicle_max_capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Operation Denied: This parcel exceeds the vehicle maximum payload capacity.';
    END IF;
END; //
DELIMITER ;

-- 15.2 Payload Enforcement Trigger (prevents parcel UPDATE into shift if it exceeds the vehicle's maximum payload)

DELIMITER //

CREATE TRIGGER check_max_payload_before_update
BEFORE UPDATE ON Parcel
FOR EACH ROW
BEGIN
    DECLARE other_parcels_weight DECIMAL(10,2);
    DECLARE vehicle_max_capacity DECIMAL(10,2);

    SELECT IFNULL(SUM(Parcel_Weight), 0) INTO other_parcels_weight
    FROM Parcel WHERE Shift_ID = NEW.Shift_ID AND Parcel_ID <> OLD.Parcel_ID;

    SELECT v.Max_Payload INTO vehicle_max_capacity
    FROM Vehicle v
    JOIN Delivery_Shift s ON v.Vehicle_ID = s.Vehicle_ID
    WHERE s.Shift_ID = NEW.Shift_ID;

    IF (other_parcels_weight + NEW.Parcel_Weight) > vehicle_max_capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Operation Denied: Updating this parcel would exceed capacity.';
    END IF;
END; //

DELIMITER ;

-- 15.3 Driver and Legal compliance trigger (only allows drivers and vehicles with valid legal compliance to start a shift)

DELIMITER //

CREATE TRIGGER trg_validate_dispatch_requirements
BEFORE INSERT ON Delivery_Shift
FOR EACH ROW
BEGIN
    DECLARE d_status VARCHAR(50);
    DECLARE v_status VARCHAR(50);

    SELECT Dispatch_Recommendation INTO d_status FROM v_Driver_Compliance WHERE Employee_ID = NEW.Employee_ID;
    SELECT Vehicle_Readiness INTO v_status FROM v_Vehicle_Compliance WHERE Vehicle_ID = NEW.Vehicle_ID;

    IF d_status != 'APPROVED' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shift Denied: Driver legal compliance failure.';
    ELSEIF v_status != 'FIT FOR DISPATCH' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shift Denied: Vehicle is grounded or in maintenance.';
    END IF;
END; //

DELIMITER ;

-- 15.4 Automated Shift and vehicle Categorisation

DELIMITER //

-- 15.4.1 automatic status management
DELIMITER //

CREATE TRIGGER trg_manage_shift_status
BEFORE UPDATE ON Delivery_Shift
FOR EACH ROW
BEGIN
    -- If the driver enters a Clock_Out time, automatically set status to 'Completed'
    IF NEW.Clock_Out IS NOT NULL AND OLD.Clock_Out IS NULL THEN
        IF NEW.Clock_In IS NOT NULL AND TIMESTAMPDIFF(SECOND, NEW.Clock_In, NEW.Clock_Out) >= 0 THEN
            SET NEW.Shift_Status = 'Completed';
        ELSEIF NEW.Clock_In IS NULL THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot clock out without a clock-in time.';
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Logic Violation: Clock-out cannot be earlier than Clock-in.';
        END IF;
    END IF;

    -- Cleanup for abandoned shifts (Your existing logic)
    IF NEW.Shift_Status != 'Completed' AND NEW.Shift_Date < CURRENT_DATE THEN
        SET NEW.Shift_Status = 'Cancelled';
    END IF;
END; //
DELIMITER ;


-- 15.4.2 Syncing vehicle to deliver shift update
CREATE TRIGGER trg_sync_vehicle_status_after_shift
AFTER UPDATE ON Delivery_Shift
FOR EACH ROW
BEGIN
    -- A. PRIMARY STATUS SYNC
    IF NEW.Shift_Status = 'Planned' THEN
        UPDATE Vehicle SET Status = 'Reserved' WHERE Vehicle_ID = NEW.Vehicle_ID;
    
    ELSEIF NEW.Shift_Status = 'Active' THEN
        UPDATE Vehicle SET Status = 'In_Use' WHERE Vehicle_ID = NEW.Vehicle_ID;
    
    ELSEIF NEW.Shift_Status IN ('Completed', 'Cancelled') THEN
        UPDATE Vehicle SET Status = 'Available' WHERE Vehicle_ID = NEW.Vehicle_ID;
    END IF;

    -- B. van swaps
    -- If the Vehicle_ID itself was changed, we must change the old vehicle too
    IF OLD.Vehicle_ID != NEW.Vehicle_ID THEN
        -- 1. set old vehicle to 'available'
        UPDATE Vehicle SET Status = 'Available' WHERE Vehicle_ID = OLD.Vehicle_ID;
        
        -- 2. give the New vehicle a status reflecting the current shift
        UPDATE Vehicle 
        SET Status = CASE 
            WHEN NEW.Shift_Status = 'Active' THEN 'In_Use'
            WHEN NEW.Shift_Status = 'Planned' THEN 'Reserved'
            ELSE 'Available'
        END
        WHERE Vehicle_ID = NEW.Vehicle_ID;
    END IF;
END; //

DELIMITER ;

--15.5 Audit log triggers for important information

DELIMITER //

-- 15.5.1  EMPLOYEE TABLE AUDIT
CREATE TRIGGER trg_audit_employee_changes
AFTER UPDATE ON Employee
FOR EACH ROW
BEGIN
    -- Aarto changes
    IF OLD.AARTO_Violations != NEW.AARTO_Violations THEN
        INSERT INTO Audit_Log (Employee_ID, Action_Type, Table_Affected, Old_Value, New_Value)
        VALUES (@current_user_id, 'AARTO_UPDATE', 'Employee', 
                CONCAT('TargetEmpID: ', NEW.Employee_ID, ' | Old: ', OLD.AARTO_Violations), 
                CAST(NEW.AARTO_Violations AS CHAR));
    END IF;

    -- Hourly rate audit
    IF OLD.Hourly_Rate != NEW.Hourly_Rate THEN
        INSERT INTO Audit_Log (Employee_ID, Action_Type, Table_Affected, Old_Value, New_Value)
        VALUES (@current_user_id, 'RATE_UPDATE', 'Employee', 
                CONCAT('TargetEmpID: ', NEW.Employee_ID, ' | Old: ', OLD.Hourly_Rate), 
                CAST(NEW.Hourly_Rate AS CHAR));
    END IF;

    -- prpd expiry date audit
    IF OLD.Prdp_Expiry != NEW.Prdp_Expiry OR (OLD.Prdp_Expiry IS NULL AND NEW.Prdp_Expiry IS NOT NULL) THEN
        INSERT INTO Audit_Log (Employee_ID, Action_Type, Table_Affected, Old_Value, New_Value)
        VALUES (@current_user_id, 'PRDP_EXPIRY_UPDATE', 'Employee', 
                CONCAT('TargetEmpID: ', NEW.Employee_ID, ' | Old: ', IFNULL(CAST(OLD.Prdp_Expiry AS CHAR), 'NULL')), 
                CAST(NEW.Prdp_Expiry AS CHAR));
    END IF;


    
END; //


-- 15.5.2 VEHICLE TABLE AUDIT
CREATE TRIGGER trg_audit_vehicle_changes
AFTER UPDATE ON Vehicle
FOR EACH ROW
BEGIN
    IF OLD.Registration_Expiry != NEW.Registration_Expiry THEN
        INSERT INTO Audit_Log (Employee_ID, Action_Type, Table_Affected, Old_Value, New_Value)
        VALUES (@current_user_id, 'VEHICLE_LICENSE_UPDATE', 'Vehicle', 
                CONCAT('VehID: ', NEW.Vehicle_ID, ' | Old: ', OLD.Registration_Expiry), 
                CAST(NEW.Registration_Expiry AS CHAR));
    END IF;
END; //


-- 15.5.3 DELIVERY SHIFT OVERRIDE AUDIT
CREATE TRIGGER trg_audit_shift_overrides
AFTER UPDATE ON Delivery_Shift
FOR EACH ROW
BEGIN
    IF OLD.Shift_Status != NEW.Shift_Status THEN
        INSERT INTO Audit_Log (Employee_ID, Action_Type, Table_Affected, Old_Value, New_Value)
        VALUES (
            @current_user_id, 
            -- The Logic Specialist's Labeler:
            CASE 
                WHEN NEW.Shift_Status = 'Completed' THEN 'DRIVER_CLOCK_OUT'
                WHEN NEW.Shift_Status = 'Active'    THEN 'DRIVER_CLOCK_IN'
                ELSE 'SHIFT_STATUS_OVERRIDE' -- Catch-all for Admin/Manual changes
            END,
            'Delivery_Shift', 
            CONCAT('ShiftID: ', NEW.Shift_ID, ' | Prev: ', OLD.Shift_Status), 
            CAST(NEW.Shift_Status AS CHAR)
        );
    END IF;
END; //

-- 15.5.5. PAYROLL RECORD AUDIT
CREATE TRIGGER trg_audit_payroll_rates
AFTER UPDATE ON Payroll_Record
FOR EACH ROW
BEGIN
    -- Log changes to the applied hourly rate
    IF OLD.Applied_Hourly_Rate != NEW.Applied_Hourly_Rate THEN
        INSERT INTO Audit_Log (
            Employee_ID,     -- The Admin making the change
            Action_Type, 
            Table_Affected, 
            Old_Value, 
            New_Value
        ) VALUES (
            @current_user_id, -- Grabs the session variable for the Admin
            'PAYROLL_RATE_CHANGE', 
            'Payroll_Record', 
            -- primary key ID of altered table written here 
            CONCAT('TargetEmpID: ', NEW.Employee_ID, ' | Old: ', OLD.Applied_Hourly_Rate), 
            CAST(NEW.Applied_Hourly_Rate AS CHAR)
        );
    END IF;
END; //

DELIMITER ;



