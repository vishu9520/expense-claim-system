-- ============================================================
--  EXPENSE CLAIM MANAGEMENT SYSTEM — Database Setup Script
--  Run this in MySQL Workbench after connecting
-- ============================================================

-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS expense_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE expense_db;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        ENUM('EMPLOYEE','MANAGER') NOT NULL DEFAULT 'EMPLOYEE',
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT        NOT NULL,
    title        VARCHAR(200)  NOT NULL,
    amount       DECIMAL(10,2) NOT NULL,
    category     ENUM('TRAVEL','FOOD','ACCOMMODATION','OFFICE_SUPPLIES','MEDICAL','OTHER') NOT NULL,
    expense_date DATE          NOT NULL,
    description  TEXT,
    status       ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    manager_comment TEXT,
    receipt_path VARCHAR(500),
    receipt_name VARCHAR(255),
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_claims_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id    BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,
    action      VARCHAR(100)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_claim FOREIGN KEY (claim_id) REFERENCES claims(id),
    CONSTRAINT fk_audit_user  FOREIGN KEY (user_id)  REFERENCES users(id)
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT        NOT NULL UNIQUE,
    token       VARCHAR(500)  NOT NULL,
    expires_at  TIMESTAMP     NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 3. SEED USERS
--    Passwords are BCrypt-hashed (cost = 10)
--    Manager@123  => seeded manager account
--    Employee@123 => all 4 dummy employees
-- ============================================================

INSERT INTO users (name, email, password, role, is_active) VALUES
-- Manager (seeded)
('Rajesh Sharma',    'manager@company.com',  '$2b$10$CAlcb9OuA6dc0Y2obropDOaGjLhe8ChsPMJxaxEjAh/ul.DYEJ9F.', 'MANAGER',  TRUE),

-- 4 Dummy Employees
('Ankit Verma',      'ankit.verma@company.com',   '$2b$10$KwZDqPO2LLB7VJ3ukjn60O1IbKy5kssGIIl/KWgxo5brTeooHZrfC', 'EMPLOYEE', TRUE),
('Priya Mehta',      'priya.mehta@company.com',   '$2b$10$KwZDqPO2LLB7VJ3ukjn60O1IbKy5kssGIIl/KWgxo5brTeooHZrfC', 'EMPLOYEE', TRUE),
('Rahul Singh',      'rahul.singh@company.com',   '$2b$10$KwZDqPO2LLB7VJ3ukjn60O1IbKy5kssGIIl/KWgxo5brTeooHZrfC', 'EMPLOYEE', TRUE),
('Sneha Patel',      'sneha.patel@company.com',   '$2b$10$KwZDqPO2LLB7VJ3ukjn60O1IbKy5kssGIIl/KWgxo5brTeooHZrfC', 'EMPLOYEE', TRUE);

-- ============================================================
-- 4. DUMMY CLAIMS DATA
-- ============================================================

-- Ankit Verma (user_id = 2) — mix of statuses
INSERT INTO claims (user_id, title, amount, category, expense_date, description, status, manager_comment) VALUES
(2, 'Client Meeting Travel - Delhi',    4500.00, 'TRAVEL',          '2026-10-05', 'Round trip to Delhi for Q3 client review meeting.',                     'APPROVED', NULL),
(2, 'Team Lunch – October',             1850.00, 'FOOD',            '2026-10-12', 'Team lunch after sprint retrospective. 6 people.',                      'APPROVED', NULL),
(2, 'Laptop Stand & Mouse',              999.00, 'OFFICE_SUPPLIES', '2026-10-18', 'Ergonomic laptop stand and wireless mouse for WFH setup.',              'PENDING',  NULL),
(2, 'Hotel Stay – Pune Visit',          6200.00, 'ACCOMMODATION',   '2026-10-22', '2-night hotel stay for on-site client training.',                       'REJECTED', 'Receipt not matching the stated amount. Please resubmit with correct invoice.'),
(2, 'Cab to Airport',                    850.00, 'TRAVEL',          '2026-10-28', 'Cab booking for early morning flight to Bangalore.',                    'PENDING',  NULL);

-- Priya Mehta (user_id = 3) — mostly pending
INSERT INTO claims (user_id, title, amount, category, expense_date, description, status, manager_comment) VALUES
(3, 'AWS Certification Exam Fee',       7500.00, 'OTHER',           '2026-09-30', 'AWS Solutions Architect exam fee. Certificate will be shared post pass.','APPROVED', NULL),
(3, 'Conference – Tech Summit Goa',    12000.00, 'TRAVEL',          '2026-10-08', 'Flight + registration for Annual Tech Summit 2026, Goa.',               'PENDING',  NULL),
(3, 'Printer Cartridges',               1200.00, 'OFFICE_SUPPLIES', '2026-10-15', '2x HP 65 Black ink cartridges for office printer.',                     'PENDING',  NULL),
(3, 'Medical – Flu Vaccine',             550.00, 'MEDICAL',         '2026-10-20', 'Annual flu shot as per company wellness programme.',                     'APPROVED', NULL),
(3, 'Client Dinner',                    3400.00, 'FOOD',            '2026-10-30', 'Dinner with key client team at Taj restaurant before contract signing.', 'PENDING',  NULL);

-- Rahul Singh (user_id = 4) — all approved
INSERT INTO claims (user_id, title, amount, category, expense_date, description, status, manager_comment) VALUES
(4, 'Monthly Metro Pass – October',     1540.00, 'TRAVEL',          '2026-10-01', 'Monthly metro pass for daily office commute.',                          'APPROVED', NULL),
(4, 'Notebook & Pens (Bulk)',            450.00, 'OFFICE_SUPPLIES', '2026-10-06', 'Stationery for new joinee induction kit.',                              'APPROVED', NULL),
(4, 'Team Offsite – Lunch & Snacks',    5500.00, 'FOOD',            '2026-10-11', 'Team offsite day catering. 12 people including external trainers.',      'APPROVED', NULL),
(4, 'Bangalore Trip – Flight',          8900.00, 'TRAVEL',          '2026-10-17', 'Return flight for data-centre audit trip.',                             'APPROVED', NULL),
(4, 'Hotel – Bangalore 3 Nights',       9600.00, 'ACCOMMODATION',   '2026-10-18', '3-night stay at Marriott for data-centre audit.',                       'APPROVED', NULL);

-- Sneha Patel (user_id = 5) — mix with rejected
INSERT INTO claims (user_id, title, amount, category, expense_date, description, status, manager_comment) VALUES
(5, 'Domain & Hosting Renewal',         2999.00, 'OTHER',           '2026-10-03', 'Annual renewal for company demo-site domain and hosting.',              'APPROVED', NULL),
(5, 'Ergonomic Chair',                 14500.00, 'OFFICE_SUPPLIES', '2026-10-09', 'Ergonomic chair for home office (WFH policy allowance).',               'REJECTED', 'Amount exceeds WFH policy limit of Rs 10,000. Please get pre-approval for higher spend.'),
(5, 'Team Pizza Party',                 2200.00, 'FOOD',            '2026-10-16', 'Celebration pizza for successful product release.',                     'APPROVED', NULL),
(5, 'Cab Reimbursement – Late Night',    720.00, 'TRAVEL',          '2026-10-24', 'Late-night cab after production deployment (post 11 PM).',              'PENDING',  NULL),
(5, 'Udemy Course – React Advanced',    1499.00, 'OTHER',           '2026-10-29', 'Advanced React course for frontend skill upgrade.',                     'PENDING',  NULL);

-- ============================================================
-- 5. AUDIT LOGS for the claims above
-- ============================================================

-- Ankit claims audit
INSERT INTO audit_logs (claim_id, user_id, action, description) VALUES
(1,  2, 'CLAIM_CREATED',   'Claim created by employee.'),
(1,  1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(2,  2, 'CLAIM_CREATED',   'Claim created by employee.'),
(2,  1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(3,  2, 'CLAIM_CREATED',   'Claim created by employee.'),
(4,  2, 'CLAIM_CREATED',   'Claim created by employee.'),
(4,  1, 'CLAIM_REJECTED',  'Claim rejected: Receipt not matching the stated amount.'),
(5,  2, 'CLAIM_CREATED',   'Claim created by employee.'),

-- Priya claims audit
(6,  3, 'CLAIM_CREATED',   'Claim created by employee.'),
(6,  1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(7,  3, 'CLAIM_CREATED',   'Claim created by employee.'),
(8,  3, 'CLAIM_CREATED',   'Claim created by employee.'),
(9,  3, 'CLAIM_CREATED',   'Claim created by employee.'),
(9,  1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(10, 3, 'CLAIM_CREATED',   'Claim created by employee.'),

-- Rahul claims audit
(11, 4, 'CLAIM_CREATED',   'Claim created by employee.'),
(11, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(12, 4, 'CLAIM_CREATED',   'Claim created by employee.'),
(12, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(13, 4, 'CLAIM_CREATED',   'Claim created by employee.'),
(13, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(14, 4, 'CLAIM_CREATED',   'Claim created by employee.'),
(14, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(15, 4, 'CLAIM_CREATED',   'Claim created by employee.'),
(15, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),

-- Sneha claims audit
(16, 5, 'CLAIM_CREATED',   'Claim created by employee.'),
(16, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(17, 5, 'CLAIM_CREATED',   'Claim created by employee.'),
(17, 1, 'CLAIM_REJECTED',  'Claim rejected: Amount exceeds WFH policy limit.'),
(18, 5, 'CLAIM_CREATED',   'Claim created by employee.'),
(18, 1, 'CLAIM_APPROVED',  'Claim approved by manager.'),
(19, 5, 'CLAIM_CREATED',   'Claim created by employee.'),
(20, 5, 'CLAIM_CREATED',   'Claim created by employee.');

-- ============================================================
-- 6. VERIFY — Quick summary check
-- ============================================================
SELECT u.name, u.email, u.role, u.is_active,
       COUNT(c.id) AS total_claims,
       IFNULL(SUM(c.amount), 0) AS total_amount
FROM users u
LEFT JOIN claims c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, u.is_active;

