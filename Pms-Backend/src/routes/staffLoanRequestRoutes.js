// Staff Loan Request Routes
import express from "express";
import {
  getAllStaffLoanRequests,
  getStaffLoanRequestsByEmployee,
  getStaffLoanRequestsByBranch,
  getStaffLoanRequestsByStatus,
  getStaffLoanRequestById,
  createStaffLoanRequest,
  updateStaffLoanRequest,
  verifyAndReviewLoanRequest,
  updateLoanRequestStatus,
  deleteStaffLoanRequest,
  getLoanRequestStatistics,
  getEmployeeLoanScoringData
} from "../controllers/staffLoanRequestController.js";

const router = express.Router();

// Statistics/Summary endpoint
router.get("/statistics", getLoanRequestStatistics);

// Get employee loan scoring data (auto-calculated)
router.get("/employee-scoring/:employeeId", getEmployeeLoanScoringData);

// Get all loan requests
router.get("/", getAllStaffLoanRequests);

// Get loan requests by filters
router.get("/employee/:employeeId", getStaffLoanRequestsByEmployee);
router.get("/branch/:branchName", getStaffLoanRequestsByBranch);
router.get("/status/:status", getStaffLoanRequestsByStatus);

// Get single loan request by ID
router.get("/:id", getStaffLoanRequestById);

// Create new loan request
router.post("/", createStaffLoanRequest);

// Update loan request (staff edit)
router.put("/:id", updateStaffLoanRequest);

// Verify and review loan request (Branch Manager/HR)
router.put("/:id/review", verifyAndReviewLoanRequest);

// Update loan request status
router.patch("/:id/status", updateLoanRequestStatus);

// Delete loan request
router.delete("/:id", deleteStaffLoanRequest);

export default router;
