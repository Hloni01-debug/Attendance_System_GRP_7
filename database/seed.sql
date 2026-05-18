SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Audit_Log;
TRUNCATE TABLE Payroll_Record;
TRUNCATE TABLE Fuel_Transaction;
TRUNCATE TABLE Parcel;
TRUNCATE TABLE Delivery_Shift;
TRUNCATE TABLE Vehicle;
TRUNCATE TABLE Employee;
TRUNCATE TABLE Role;
TRUNCATE TABLE Warehouse;
TRUNCATE TABLE Parcel_Status;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. ROLE 
INSERT INTO Role (Name, Description) VALUES 
('Driver', 'Handles vehicle operation and parcel delivery'),
('Fleet Admin', 'Monitors vehicle health and fuel theft hearings'),
('Finance Admin', 'Oversees payroll and bonuses');

-- 2. WAREHOUSE (3 Strategic Hubs)
INSERT INTO Warehouse (Name, Street, City, Province, Contact_Number) VALUES 
('Joburg Hub', '12 Hans Schoeman Road', 'Johannesburg', 'Gauteng', '011-555-0101'),
('Cape Town Depot', '45 Prestwich Street', 'Cape Town', 'Western Cape', '021-555-0202'),
('Durban Port', '5 Point Road', 'Durban', 'KwaZulu-Natal', '031-555-0303');

-- 3. EMPLOYEE (Drivers and Admins)
INSERT INTO Employee (Warehouse_ID, Role_ID, First_Name, Last_Name, Email, Password_Hash, Phone, Hourly_Rate, AARTO_Violations, Prdp_Expiry) VALUES 
(1, 1, 'Alice', 'Smith', 'alice@liftex.co.za', 'alicepass', '0827893291', 150.00, 0, '2026-12-31'), 
(1, 2, 'Bob', 'Jones', 'bob@liftex.co.za', 'bobpass', '0898738264', 200.00, 0, '2027-05-20'),  
(2, 1, 'Charlie', 'Brown', 'charlie@liftex.co.za', 'charliePass', '0712345678', 155.00, 0, '2027-08-12'), 
(1, 1, 'Lerato', 'Sechaba', 'Lerato@liftex.co.za','Leratopass', '0831234567', 145.00, 2, '2026-11-15'),  
(3, 1, 'Eve', 'Wilson', 'driver1@liftex.co.za', 'password123', '0722223333', 160.00, 0, '2027-01-01'), 
(3, 2, 'Kgosi', 'Morafe', 'admin@liftex.co.za', 'password123', '0722224444', 160.00, 0, '2027-01-01');

-- 4. VEHICLE (Multiple Classes)
INSERT INTO Vehicle (Registration_Number, Registration_Expiry, COF_Expiry, Max_Payload, Make, Model, Status) VALUES
('LFX-001-NW', '2027-05-24', '2027-06-14', 2500.00, 'Toyota', 'Quantum', 'Available'),
('LFX-002-GP', '2026-11-10', '2026-12-01', 3500.00, 'Mercedes-Benz', 'Sprinter', 'Available'),
('LFX-003-NW', '2027-01-15', '2027-02-15', 800.00, 'Volkswagen', 'Caddy', 'Available'),
('LFX-004-KZN', '2026-08-01', '2026-08-15', 5000.00, 'Hino', '300 Series', 'Available'),
('LFX-005-GP', '2027-09-01', '2027-09-15', 2500.00, 'Ford', 'Transit', 'Maintenance');

-- 5. PARCEL STATUS
INSERT INTO Parcel_Status (Status_ID, Status_Name, Status_Description) VALUES 
(1, 'Pending', 'Awaiting dispatch'),
(2, 'In-Transit', 'With driver'),
(3, 'Delivered', 'Completed delivery');

-- 6. DELIVERY_SHIFT (Aggregated data for May 2026)
INSERT INTO Delivery_Shift (Employee_ID, Vehicle_ID, Start_Warehouse_ID, End_Warehouse_ID, Shift_Date, Clock_In, Clock_Out, Odometer_Start, Odometer_End, Tank_Start, Tank_End, Fuel_Consumed_CAN, Missing_Fuel_Status, Shift_Status) VALUES 
(1, 1, 1, 1, '2026-05-01', '2026-05-01 08:00:00', '2026-05-01 17:00:00', 10000.00, 10200.00, 100.00, 40.00, 40.00, 'Stolen', 'Completed'),
(1, 1, 1, 1, '2026-05-05', '2026-05-05 08:00:00', '2026-05-05 16:00:00', 10200.00, 10500.00, 100.00, 50.00, 50.00, 'None', 'Completed'),
(1, 2, 1, 1, '2026-05-10', '2026-05-10 09:00:00', '2026-05-10 13:00:00', 5000.00, 5150.00, 80.00, 60.00, 20.00, 'None', 'Completed'),
(4, 3, 1, 2, '2026-05-12', '2026-05-12 07:30:00', '2026-05-12 18:30:00', 3000.00, 3450.00, 60.00, 15.00, 40.00, 'Mechanical Fault', 'Completed'),
(4, 3, 2, 1, '2026-05-18', '2026-05-18 08:00:00', NULL, 3450.00, NULL, 60.00, NULL, NULL, 'None', 'Active'),
(3, 2, 1, 2, '2026-05-18', '2026-05-18 09:30:00', NULL, 12000.00, NULL, 80.00, NULL, NULL, 'None', 'Active'),
(5, 4, 3, 3, '2026-05-18', '2026-05-18 11:00:00', NULL, 50000.00, NULL, 100.00, NULL, NULL, 'None', 'Active'),
(1, 1, 1, 2, '2026-05-19', NULL, NULL, 10500.00, NULL, 100.00, NULL, NULL, 'None', 'Planned'),
(4, 3, 2, 2, '2026-05-20', NULL, NULL, 3450.00, NULL, 75.00, NULL, NULL, 'None', 'Planned');

-- 7. PARCEL (Multiple parcels per shift for weight/productivity testing)
INSERT INTO Parcel (Shift_ID, Warehouse_ID, Parcel_Weight, Origin_Address, Destination_Address, Receiver_Name, Status_ID) VALUES 
(1, 1, 200, 'Joburg', 'Sandton', 'S. Doe', 3), (1, 1, 150, 'Joburg', 'Midrand', 'P. Parker', 3), 
(2, 1, 100, 'Joburg', 'Randburg', 'B. Wayne', 3), (2, 1, 100, 'Joburg', 'Randburg', 'C. Kent', 3), (2, 1, 50, 'Joburg', 'Randburg', 'D. Prince', 3), 
(3, 1, 400, 'Joburg', 'Pretoria', 'A. Curry', 3), 
(4, 1, 120, 'Joburg', 'Cape Town', 'V. Stone', 3);

-- 8. FUEL_TRANSACTION (Refills for Alice's first shift)
INSERT INTO Fuel_Transaction (Shift_ID, Fuel_Litres, Fuel_Cost) VALUES 
(1, 20, 480.00), (1, 15, 360.00);

-- 9. AUDIT_LOG KEPT INTENTIONALLY EMPTY