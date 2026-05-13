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

// Bulk Excel import
router.post("/import-excel", upload.single("file"), importExcelLoanAccountMapping);

export default router;
