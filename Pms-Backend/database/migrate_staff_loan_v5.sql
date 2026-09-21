-- Migration v5: checker verifies loan application count, approver role

-- Checker verification of loan application count
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS checker_loan_application_verified   BOOLEAN,
  ADD COLUMN IF NOT EXISTS checker_loan_application_remarks    TEXT;

-- Final approver fields
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS approved_by        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS approved_at        TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approver_remarks   TEXT;

COMMENT ON COLUMN staff_loan_requests.checker_loan_application_verified
  IS 'TRUE = loan application count confirmed by Checker; FALSE = discrepancy found';
COMMENT ON COLUMN staff_loan_requests.approved_by
  IS 'Email of the Employee Approver who gave final green light';
COMMENT ON COLUMN staff_loan_requests.approved_at
  IS 'Timestamp when the final approval was given';
