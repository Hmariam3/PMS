// Staff Loan Request Routes
import express from "express";
import {
  getAllStaffLoanRequests,
  getStaffLoanRequestsByEmployee,
  getStaffLoanRequestsByCreator,
  getStaffLoanRequestsByBranch,
  getStaffLoanRequestsByStatus,
  getStaffLoanRequestById,
  createStaffLoanRequest,
  updateStaffLoanRequest,
  verifyAndReviewLoanRequest,
  updateLoanRequestStatus,
  deleteStaffLoanRequest,
  getLoanRequestStatistics,
  getEmployeeLoanScoringData,
  uploadLoanDocument,
  downloadLoanDocument,
  deleteLoanDocumentById,
  uploadGuarantorDocument,
  downloadGuarantorDocument,
  managerReview,
  checkerReview,
  approverApprove,
  getRecommendedRequests,
} from "../controllers/staffLoanRequestController.js";
import { loanDocUpload } from "../middleware/loanDocumentUpload.js";

const router = express.Router();

// Statistics/Summary endpoint
router.get("/statistics", getLoanRequestStatistics);

// Recommended requests (for Approver page) — must be BEFORE /:id
router.get("/recommended", getRecommendedRequests);

// Get employee loan scoring data (auto-calculated)
router.get("/employee-scoring/:employeeId", getEmployeeLoanScoringData);

// Get all loan requests (Employee Manager / Checker only)
router.get("/", getAllStaffLoanRequests);

// Get loan requests by filters
router.get("/employee/:employeeId", getStaffLoanRequestsByEmployee);
router.get("/creator/:email",       getStaffLoanRequestsByCreator);
router.get("/branch/:branchName",   getStaffLoanRequestsByBranch);
router.get("/status/:status",       getStaffLoanRequestsByStatus);

// Get single loan request by ID  ← must come after all static GET routes
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

// Document upload, view and delete
router.post("/:id/document",             loanDocUpload.single("document"), uploadLoanDocument);
router.get( "/:id/document",             downloadLoanDocument);
router.delete("/:id/document",           deleteLoanDocumentById);

// Guarantor document upload, view and delete
router.post("/:id/guarantor-document",   loanDocUpload.single("document"), uploadGuarantorDocument);
router.get( "/:id/guarantor-document",   downloadGuarantorDocument);

// Two-stage approval workflow
router.post("/:id/manager-review", managerReview);
router.post("/:id/checker-review", checkerReview);

// Final approver
router.post("/:id/approve", approverApprove);

export default router;
