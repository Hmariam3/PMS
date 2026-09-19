-- Migration v3: two-stage approval workflow
-- Employee Manager  → verifies scores + deduction fields
-- Employee Checker  → verifies disciplinary record

-- ── Employee Manager review fields ───────────────────────────────────────────
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS manager_verified          BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manager_verified_by       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS manager_verified_at       TIMESTAMP,

  -- Verified scores (manager re-confirms the auto-calculated values)
  ADD COLUMN IF NOT EXISTS mgr_verified_service_score       INT,
  ADD COLUMN IF NOT EXISTS mgr_verified_individual_score    INT,
  ADD COLUMN IF NOT EXISTS mgr_verified_team_score          INT,
  ADD COLUMN IF NOT EXISTS mgr_verified_total_score         INT,

  -- Deduction / affordability fields
  ADD COLUMN IF NOT EXISTS deduction_amount          DECIMAL(15,2),   -- monthly deduction
  ADD COLUMN IF NOT EXISTS deduction_months          INT,             -- repayment period (months)
  ADD COLUMN IF NOT EXISTS net_salary_after_deduction DECIMAL(15,2),  -- basic_salary - deduction_amount
  ADD COLUMN IF NOT EXISTS manager_remarks           TEXT;

-- ── Employee Checker review fields ───────────────────────────────────────────
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS checker_verified          BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checker_verified_by       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS checker_verified_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS checker_disciplinary_verified  BOOLEAN,  -- TRUE = clean, FALSE = flag
  ADD COLUMN IF NOT EXISTS checker_remarks           TEXT;

-- ── Overall workflow status ───────────────────────────────────────────────────
-- Extends the existing `status` column values without changing the column.
-- New values in use:
--   'Pending'                  → submitted, no review yet
--   'Manager Review'           → manager has verified
--   'Checker Review'           → checker has verified  (both done)
--   'Approved'                 → fully approved
--   'Rejected'                 → rejected at any stage
--   'Not Recommended'          → checker flagged disciplinary issue

COMMENT ON COLUMN staff_loan_requests.manager_verified
  IS 'Set to TRUE when Employee Manager completes their review';
COMMENT ON COLUMN staff_loan_requests.checker_verified
  IS 'Set to TRUE when Employee Checker completes their review';
COMMENT ON COLUMN staff_loan_requests.deduction_amount
  IS 'Monthly loan deduction amount set by Employee Manager';
COMMENT ON COLUMN staff_loan_requests.deduction_months
  IS 'Repayment period in months set by Employee Manager';
COMMENT ON COLUMN staff_loan_requests.net_salary_after_deduction
  IS 'Remaining salary after deduction: basic_salary - deduction_amount';
COMMENT ON COLUMN staff_loan_requests.checker_disciplinary_verified
  IS 'TRUE = disciplinary record confirmed clean by Checker; FALSE = issue flagged';
