-- Migration v9: Add special_review flag
-- Set when an employee fails the threshold solely due to Length of Service (Criterion 1)
-- but their performance-based score would meet it with maximum tenure points.
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS special_review BOOLEAN DEFAULT FALSE;
