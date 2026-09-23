-- Migration v7: Remove unused legacy columns from staff_loan_requests
--
-- Columns being dropped and the reason:
--
-- verified_service_score              } Written only by the legacy PUT /:id/review endpoint
-- verified_individual_performance_score } which is never called by the current frontend.
-- verified_team_performance_score      } The current workflow uses mgr_verified_* columns
-- verified_disciplinary_score          } instead.
-- verified_total_score                 }
--
-- staff_signature                     — never read or written by any code (staff_signature_date IS kept)
--
-- reviewed_by                         } Written only by the legacy PUT /:id/review endpoint.
-- reviewer_signature                  } reviewer_signature never existed as an active field.
-- review_date                         }
-- reviewer_comments                   }
--
-- All other columns are actively used and are kept.

ALTER TABLE staff_loan_requests
  DROP COLUMN IF EXISTS verified_service_score,
  DROP COLUMN IF EXISTS verified_individual_performance_score,
  DROP COLUMN IF EXISTS verified_team_performance_score,
  DROP COLUMN IF EXISTS verified_disciplinary_score,
  DROP COLUMN IF EXISTS verified_total_score,
  DROP COLUMN IF EXISTS staff_signature,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewer_signature,
  DROP COLUMN IF EXISTS review_date,
  DROP COLUMN IF EXISTS reviewer_comments;
