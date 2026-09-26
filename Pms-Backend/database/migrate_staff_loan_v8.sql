-- Migration v8: Add loan_processor_assigned column
-- Stores the name (and title) of the person assigned from the loan processing branch
ALTER TABLE staff_loan_requests
  ADD COLUMN IF NOT EXISTS loan_processor_assigned TEXT;
