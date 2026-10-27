-- =====================================================================
-- AccessDesk | Phase 1: Database schema
-- Database : mydb8        (same as the access privileges lecture)
-- Table    : customers4   (columns: name, address)
-- Run in   : XAMPP -> phpMyAdmin -> SQL tab, or:  mysql -u root < database.sql
-- Safe to re-run: it never drops anything, and seed rows are inserted
-- only when the table is empty.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS mydb8
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mydb8;

CREATE TABLE IF NOT EXISTS customers4 (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name    VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_customers4_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Seed data: 24 customers.
-- Admin may load 20 rows, so we need more than 20 to prove the cap works.
-- Several names contain "Ali" so the search demo returns multiple rows
-- (Ali, Alina, Khalid, Saleem, Malik ...).
-- ---------------------------------------------------------------------
INSERT INTO customers4 (name, address)
SELECT s.name, s.address
FROM (
  SELECT 'Ali Raza'        AS name, 'Taxila'          AS address UNION ALL
  SELECT 'Alina Fatima',          'Rawalpindi'                 UNION ALL
  SELECT 'Ahmed Khan',            'Islamabad'                  UNION ALL
  SELECT 'Bilal Hussain',         'Lahore'                     UNION ALL
  SELECT 'Sara Malik',            'Kamra Cantt'                UNION ALL
  SELECT 'Hamza Tariq',           'Attock'                     UNION ALL
  SELECT 'Ayesha Noor',           'Wah Cantt'                  UNION ALL
  SELECT 'Usman Ghani',           'Peshawar'                   UNION ALL
  SELECT 'Zainab Iqbal',          'Faisalabad'                 UNION ALL
  SELECT 'Khalid Mehmood',        'Multan'                     UNION ALL
  SELECT 'Hina Aslam',            'Sialkot'                    UNION ALL
  SELECT 'Faisal Saleem',         'Gujranwala'                 UNION ALL
  SELECT 'Maryam Siddiqui',       'Karachi'                    UNION ALL
  SELECT 'Omar Farooq',           'Quetta'                     UNION ALL
  SELECT 'Nadia Pervaiz',         'Murree'                     UNION ALL
  SELECT 'Imran Shah',            'Abbottabad'                 UNION ALL
  SELECT 'Rabia Anwar',           'Jhelum'                     UNION ALL
  SELECT 'Tahir Mahmood',         'Chakwal'                    UNION ALL
  SELECT 'Sana Javed',            'Hasan Abdal'                UNION ALL
  SELECT 'Danish Ali',            'Fateh Jang'                 UNION ALL
  SELECT 'Mehwish Rauf',          'Gujrat'                     UNION ALL
  SELECT 'Kamran Butt',           'Sargodha'                   UNION ALL
  SELECT 'Laiba Yousaf',          'Mardan'                     UNION ALL
  SELECT 'Shahid Afridi Khan',    'Haripur'
) AS s
WHERE NOT EXISTS (SELECT 1 FROM customers4);

-- Quick check (should return 24 on a fresh install):
-- SELECT COUNT(*) FROM customers4;
