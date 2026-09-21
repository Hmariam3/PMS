-- Migration v4: fix status CHECK constraint and add deduction breakdown columns

-- Drop the old rigid constraint that doesn't include the new workflow statuses
ALTER TABLE staff_loan_requests
  DROP CONSTRAINT IF EXISTS staff_loan_requests_status_check;

-- Re-add with all valid values
ALTER TABLE staff_loan_requests
  ADD CONSTRAINT staff_loan_requests_status_check
  CHECK (status IN (
    'Pending',
    'Under Review',
    'Manager Review',
    'Checker Review',
    'Recommended',
    'Not Recommended',
    'Approved',
    'Rejected'
  ));

-- Deduction breakdown columns (individual line items)
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS deduction_income_tax        DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS deduction_pension_7         DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS deduction_other_items       JSONB,         -- [{label, amount}] dynamic extras
  ADD COLUMN IF NOT EXISTS total_deduction             DECIMAL(15,2), -- sum of all deductions
  ADD COLUMN IF NOT EXISTS outstanding_balances        JSONB;         -- [{label, amount}] e.g. HL, ESL balances

COMMENT ON COLUMN staff_loan_requests.deduction_income_tax  IS 'Income tax deduction amount';
COMMENT ON COLUMN staff_loan_requests.deduction_pension_7   IS '7% employee pension contribution';
COMMENT ON COLUMN staff_loan_requests.deduction_other_items IS 'JSON array of extra deductions: [{label, amount}]';
COMMENT ON COLUMN staff_loan_requests.total_deduction       IS 'Sum of all deduction line items';
COMMENT ON COLUMN staff_loan_requests.outstanding_balances  IS 'JSON array of outstanding loan balances: [{label, amount}]';
