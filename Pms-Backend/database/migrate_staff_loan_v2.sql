-- Migration: staff_loan_requests v2
-- Adds new fields from Phase 2/3 frontend updates

-- 1. Date of Birth
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS dob DATE;

-- 2. Basic Salary
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS basic_salary DECIMAL(15,2);

-- 3. Loan Application Count (First Time / Second Time / Third Time / More than Three Times)
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS loan_application_count VARCHAR(50);

-- 4. Retirement Date (DOB + 60 years, auto-calculated on frontend)
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS retirement_date DATE;

-- 5. Attached document filename (the actual file is stored on disk/S3; we store the name)
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS attachment_file_name VARCHAR(500);

-- 6. Attachment file path (for when file upload is wired to storage)
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS attachment_file_path VARCHAR(1000);

-- 7. Drop the rigid total_score_claimed CHECK constraint so Emergency Loans
--    (which have no scoring) don't get blocked.
--    We keep the column but remove the constraint that enforced the sum.
ALTER TABLE staff_loan_requests
  DROP CONSTRAINT IF EXISTS chk_total_claimed;

-- 8. Update the loan_type CHECK constraint (if one exists) to include Emergency Loan.
--    The original schema used a comment, not a CHECK, so this is a safety net.
ALTER TABLE staff_loan_requests
  DROP CONSTRAINT IF EXISTS staff_loan_requests_loan_type_check;

-- 9. Add comments
COMMENT ON COLUMN staff_loan_requests.dob                    IS 'Employee date of birth (from employees table)';
COMMENT ON COLUMN staff_loan_requests.basic_salary           IS 'Monthly basic salary at time of application';
COMMENT ON COLUMN staff_loan_requests.loan_application_count IS 'First Time / Second Time / Third Time / More than Three Times';
COMMENT ON COLUMN staff_loan_requests.retirement_date        IS 'Calculated retirement date: DOB + 60 years';
COMMENT ON COLUMN staff_loan_requests.attachment_file_name   IS 'Original filename of the uploaded supporting document';
COMMENT ON COLUMN staff_loan_requests.attachment_file_path   IS 'Server-side path or cloud URL of the uploaded document';
