CREATE DATABASE liftex_db;
USE liftex_db;

CREATE DATABASE IF NOT EXISTS liftex_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE liftex_db;

-- -------------------------------------------------------------
-- Table: Warehouses
-- Stores warehouse/depot locations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Warehouses (
  warehouse_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  location       VARCHAR(255) NOT NULL,
  contact_phone  VARCHAR(20),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Employees
-- Stores all staff accounts and roles
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Employees (
  employee_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name     VARCHAR(50) NOT NULL,
  last_name      VARCHAR(50) NOT NULL,
  email          VARCHAR(100) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('admin', 'driver', 'finance', 'warehouse') NOT NULL DEFAULT 'driver',
  warehouse_id   INT UNSIGNED,
  hourly_rate    DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_warehouse FOREIGN KEY (warehouse_id)
    REFERENCES Warehouses(warehouse_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Attendance
-- Tracks daily check-in/check-out per employee per warehouse
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Attendance (
  attendance_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNSIGNED NOT NULL,
  warehouse_id   INT UNSIGNED NOT NULL,
  check_in       DATETIME NOT NULL,
  check_out      DATETIME,
  hours_worked   DECIMAL(5,2) GENERATED ALWAYS AS (
                   TIMESTAMPDIFF(MINUTE, check_in, check_out) / 60
                 ) STORED,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_employee  FOREIGN KEY (employee_id)  REFERENCES Employees(employee_id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_warehouse FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Vehicles
-- Company vehicle fleet
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Vehicles (
  vehicle_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plate_number   VARCHAR(20) NOT NULL UNIQUE,
  make           VARCHAR(50),
  model          VARCHAR(50),
  year           YEAR,
  capacity_kg    DECIMAL(8,2),
  status         ENUM('available', 'in_use', 'maintenance') NOT NULL DEFAULT 'available',
  warehouse_id   INT UNSIGNED,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_veh_warehouse FOREIGN KEY (warehouse_id)
    REFERENCES Warehouses(warehouse_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Delivery_Shifts
-- Represents a driver's delivery run (links employee + vehicle)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Delivery_Shifts (
  shift_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNSIGNED NOT NULL,
  vehicle_id     INT UNSIGNED NOT NULL,
  warehouse_id   INT UNSIGNED NOT NULL,
  start_time     DATETIME NOT NULL,
  end_time       DATETIME,
  route_notes    TEXT,
  status         ENUM('planned', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shift_employee  FOREIGN KEY (employee_id)  REFERENCES Employees(employee_id)  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_shift_vehicle   FOREIGN KEY (vehicle_id)   REFERENCES Vehicles(vehicle_id)    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_shift_warehouse FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Parcels
-- Parcel chain of custody — linked to delivery shifts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Parcels (
  parcel_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tracking_code  VARCHAR(50) NOT NULL UNIQUE,
  shift_id       INT UNSIGNED,
  sender_name    VARCHAR(100) NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_addr VARCHAR(255) NOT NULL,
  weight_kg      DECIMAL(6,2),
  status         ENUM('pending', 'in_transit', 'delivered', 'failed', 'returned') NOT NULL DEFAULT 'pending',
  delivered_at   DATETIME,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_parcel_shift FOREIGN KEY (shift_id)
    REFERENCES Delivery_Shifts(shift_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Fuel_Transactions
-- Logs fuel refills per vehicle per shift
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Fuel_Transactions (
  fuel_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id     INT UNSIGNED NOT NULL,
  shift_id       INT UNSIGNED,
  litres         DECIMAL(7,2) NOT NULL,
  cost_per_litre DECIMAL(6,2) NOT NULL,
  total_cost     DECIMAL(10,2) GENERATED ALWAYS AS (litres * cost_per_litre) STORED,
  recorded_by    INT UNSIGNED,
  recorded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fuel_vehicle  FOREIGN KEY (vehicle_id)  REFERENCES Vehicles(vehicle_id)       ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_shift    FOREIGN KEY (shift_id)    REFERENCES Delivery_Shifts(shift_id)  ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_recorder FOREIGN KEY (recorded_by) REFERENCES Employees(employee_id)     ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Payroll_Records
-- Monthly payroll per employee
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Payroll_Records (
  payroll_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNSIGNED NOT NULL,
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL,
  total_hours    DECIMAL(7,2) NOT NULL DEFAULT 0,
  hourly_rate    DECIMAL(8,2) NOT NULL,
  base_pay       DECIMAL(10,2) GENERATED ALWAYS AS (total_hours * hourly_rate) STORED,
  bonus          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  deductions     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  net_pay        DECIMAL(10,2) GENERATED ALWAYS AS (
                   (total_hours * hourly_rate) + bonus - deductions
                 ) STORED,
  status         ENUM('draft', 'approved', 'paid') NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_employee FOREIGN KEY (employee_id)
    REFERENCES Employees(employee_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: Audit_Log
-- Tracks all significant data changes across the system
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Audit_Log (
  log_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED,
  action_type    ENUM('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
  table_affected VARCHAR(50),
  record_id      INT UNSIGNED,
  description    TEXT,
  ip_address     VARCHAR(45),
  logged_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
    REFERENCES Employees(employee_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;