import express from "express";
import {
  getAllLoanAccountMappings,
  getLoanAccountMappingById,
  createLoanAccountMapping,
  updateLoanAccountMapping,
  deleteLoanAccountMapping,
  getLoanBalanceDifferenceByUser,
  getLoanAccountMappingsByUser,
  importExcelLoanAccountMapping,
  getLoanOutstandingBalanceByUser,
  getSpecialMentionLoanSumBalanceByUser
} from "../controllers/loanAccountMappingController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getAllLoanAccountMappings);
router.get("/:id", getLoanAccountMappingById);
router.post("/", createLoanAccountMapping);
router.post("/getLoanBalanceDifference/", getLoanBalanceDifferenceByUser);
router.post("/getLoanAccountMappingsByUser/", getLoanAccountMappingsByUser);
router.put("/:id", updateLoanAccountMapping);
router.delete("/:id", deleteLoanAccountMapping);

// Special Mention Outstanding Balance for Loans
router.post("/getSpecialMentionLoanSumBalanceByUser/", getSpecialMentionLoanSumBalanceByUser);
router.post("/getLoanOutstandingBalanceByUser/", getLoanOutstandingBalanceByUser);
// Bulk Excel import
router.post("/import-excel", upload.single("file"), importExcelLoanAccountMapping);

export default router;
