-- Staff Loan Request Form Database Schema
-- This table stores staff loan requests with self-assessment scoring and approval workflow

CREATE TABLE IF NOT EXISTS staff_loan_requests (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Employee Information
    employee_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    date_of_hire DATE NOT NULL,
    length_of_service_years DECIMAL(5,2),
    phone_extension VARCHAR(50),
    date_of_request DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Loan Details
    loan_type VARCHAR(100) NOT NULL, -- 'Personal Against Suretyship', 'Housing/Mortgage', 'Automobile'
    loan_amount_requested DECIMAL(15,2) NOT NULL,
    loan_purpose TEXT,
    
    -- Self-Assessment Scoring (Staff Claims)
    -- Criterion 1: Length of Service
    service_tenure_band VARCHAR(50), -- '10+ years', '6-10 years', '3-6 years', '1-3 years', '<1 year'
    service_tenure_score INT DEFAULT 0 CHECK (service_tenure_score >= 0 AND service_tenure_score <= 20),
    
    -- Criterion 2: Individual Performance
    individual_performance_band VARCHAR(50), -- '>120%', '100-119.99%', '75-99.99%', '50-74.99%', '0-50%', 'Not rated'
    individual_performance_score INT DEFAULT 0 CHECK (individual_performance_score >= 0 AND individual_performance_score <= 50),
    
    -- Criterion 3: Team Performance
    team_performance_band VARCHAR(50), -- '>120%', '100-119.99%', '75-99.99%', '50-74.99%', '0-50%', 'Not rated'
    team_performance_score INT DEFAULT 0 CHECK (team_performance_score >= 0 AND team_performance_score <= 20),
    
    -- Criterion 6: Disciplinary Record
    disciplinary_record_band VARCHAR(100), -- 'Clean record', 'Minor sanction', 'Major/active sanction'
    disciplinary_record_score INT DEFAULT 0 CHECK (disciplinary_record_score >= 0 AND disciplinary_record_score <= 10),
    
    -- Total Score (Self-assessed by staff)
    total_score_claimed INT DEFAULT 0 CHECK (total_score_claimed >= 0 AND total_score_claimed <= 100),
    
    -- Verified Scores (Filled by Branch Manager/HR)
    verified_service_score INT CHECK (verified_service_score >= 0 AND verified_service_score <= 20),
    verified_individual_performance_score INT CHECK (verified_individual_performance_score >= 0 AND verified_individual_performance_score <= 50),
    verified_team_performance_score INT CHECK (verified_team_performance_score >= 0 AND verified_team_performance_score <= 20),
    verified_disciplinary_score INT CHECK (verified_disciplinary_score >= 0 AND verified_disciplinary_score <= 10),
    verified_total_score INT CHECK (verified_total_score >= 0 AND verified_total_score <= 100),
    
    -- Staff Declaration
    staff_declaration_confirmed BOOLEAN DEFAULT FALSE,
    staff_signature VARCHAR(255), -- Could store digital signature or confirmation
    staff_signature_date DATE,
    
    -- Approval Workflow
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Recommended', 'Not Recommended', 'Approved', 'Rejected')),
    reviewed_by VARCHAR(255), -- Branch Manager name/email
    reviewer_signature VARCHAR(255),
    review_date DATE,
    decision VARCHAR(50) CHECK (decision IN ('Recommended', 'Not Recommended', NULL)),
    reviewer_comments TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255), -- User email who created the request
    updated_by VARCHAR(255), -- Last user who updated
    
    -- Foreign Key Constraint (if employees table exists)
    -- CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    
    -- Indexes for better query performance
    CONSTRAINT chk_total_claimed CHECK (total_score_claimed = 
        COALESCE(service_tenure_score, 0) + 
        COALESCE(individual_performance_score, 0) + 
        COALESCE(team_performance_score, 0) + 
        COALESCE(disciplinary_record_score, 0))
);

-- Create indexes for frequently queried columns
CREATE INDEX idx_staff_loan_employee_id ON staff_loan_requests(employee_id);
CREATE INDEX idx_staff_loan_status ON staff_loan_requests(status);
CREATE INDEX idx_staff_loan_created_at ON staff_loan_requests(created_at);
CREATE INDEX idx_staff_loan_branch ON staff_loan_requests(branch_name);
CREATE INDEX idx_staff_loan_date_of_request ON staff_loan_requests(date_of_request);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_loan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_staff_loan_timestamp
    BEFORE UPDATE ON staff_loan_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_loan_timestamp();

-- Comments for documentation
COMMENT ON TABLE staff_loan_requests IS 'Stores staff loan request forms with self-assessment scoring criteria for branch staff';
COMMENT ON COLUMN staff_loan_requests.loan_type IS 'Type of loan: Personal Against Suretyship, Housing/Mortgage, or Automobile';
COMMENT ON COLUMN staff_loan_requests.total_score_claimed IS 'Self-assessed total score by staff (max 100 for branch staff)';
COMMENT ON COLUMN staff_loan_requests.verified_total_score IS 'Verified total score by Branch Manager/HR (max 100)';
COMMENT ON COLUMN staff_loan_requests.status IS 'Current status: Pending, Under Review, Recommended, Not Recommended, Approved, Rejected';

-- Sample query to retrieve loan requests with calculated scores
-- SELECT 
--     id,
--     full_name,
--     employee_id,
--     branch_name,
--     loan_type,
--     loan_amount_requested,
--     total_score_claimed,
--     verified_total_score,
--     status,
--     date_of_request,
--     created_at
-- FROM staff_loan_requests
-- ORDER BY created_at DESC;
