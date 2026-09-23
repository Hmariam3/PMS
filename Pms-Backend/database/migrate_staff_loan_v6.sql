-- Migration v6: Add new fields for staff loan request enhancements
-- 1. loan_processing_branch (replaces loan_purpose)
-- 2. Guarantor document attachment fields
-- 3. Criteria 4 (District Office Engagement) & 5 (OKR/KPIs) scoring fields
-- 4. Guarantor deduction/outstanding balance fields
-- 5. employee_organization_unit (to track Branch/HO/DO for criteria visibility)

ALTER TABLE staff_loan_requests

  -- Replace loan_purpose with loan_processing_branch (keep loan_purpose for backward-compat)
  ADD COLUMN IF NOT EXISTS loan_processing_branch       TEXT,

  -- Employee organization unit (Branch / HO / DO)
  ADD COLUMN IF NOT EXISTS employee_organization_unit   TEXT,

  -- Criterion 4: District Office Engagement Result (only for DO staff)
  ADD COLUMN IF NOT EXISTS district_engagement_band     TEXT,
  ADD COLUMN IF NOT EXISTS district_engagement_score    INT         DEFAULT 0,

  -- Criterion 5: OKR and KPIs Result
  -- DO staff use district_okr_*, HO staff use ho_okr_*
  ADD COLUMN IF NOT EXISTS okr_kpi_band                 TEXT,
  ADD COLUMN IF NOT EXISTS okr_kpi_score                INT         DEFAULT 0,

  -- Guarantor document attachment
  ADD COLUMN IF NOT EXISTS guarantor_attachment_file_name  TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_attachment_file_path  TEXT,

  -- Guarantor deduction fields (mirrors borrower deduction section)
  ADD COLUMN IF NOT EXISTS guarantor_basic_salary               NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS guarantor_deduction_income_tax       NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS guarantor_deduction_pension_7        NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS guarantor_deduction_other_items      JSONB        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS guarantor_deduction_amount           NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS guarantor_deduction_months           INT,
  ADD COLUMN IF NOT EXISTS guarantor_total_deduction            NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS guarantor_net_salary_after_deduction NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS guarantor_outstanding_balances       JSONB        DEFAULT '[]';

-- Update total_score_claimed logic note (criteria 4 & 5 are now included in total)
-- No structural change needed; the backend recalculates the sum dynamically.

COMMENT ON COLUMN staff_loan_requests.loan_processing_branch IS 'Branch selected for loan processing (replaces free-text loan_purpose)';
COMMENT ON COLUMN staff_loan_requests.employee_organization_unit IS 'Employee org unit at time of submission: Branch | HO | DO';
COMMENT ON COLUMN staff_loan_requests.district_engagement_band IS 'Criterion 4: District Office Engagement Result band (DO only)';
COMMENT ON COLUMN staff_loan_requests.district_engagement_score IS 'Criterion 4 score 0-50 (DO only)';
COMMENT ON COLUMN staff_loan_requests.okr_kpi_band IS 'Criterion 5: OKR/KPI band (DO staff = 0-20pts, HO staff = 0-70pts)';
COMMENT ON COLUMN staff_loan_requests.okr_kpi_score IS 'Criterion 5 score';
COMMENT ON COLUMN staff_loan_requests.guarantor_attachment_file_name IS 'Guarantor document filename on disk';
COMMENT ON COLUMN staff_loan_requests.guarantor_attachment_file_path IS 'Guarantor document relative path on disk';
