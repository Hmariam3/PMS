import express from "express";
import {
  getAllAccountMappings,
  getAccountMappingsByUser,
  getAccountMappingById,
  createAccountMapping,
  updateAccountMapping,
  deleteAccountMapping,
  getBalanceDifferenceByUser,
  getFcyAccountMappingsByUser,
  importExcelAccountMappingFCY,
} from "../controllers/accountMappingFCYController.js";
import { upload } from "../middleware/upload.js";
const router = express.Router();
router.get("/", getAllAccountMappings);
router.post("/by-user", getAccountMappingsByUser);
router.post("/balance-difference", getBalanceDifferenceByUser);
router.get("/:id", getAccountMappingById);
router.post("/", createAccountMapping);
router.post("/getFcyAccountMappingsByUser/", getFcyAccountMappingsByUser);
router.put("/:id", updateAccountMapping);
router.delete("/:id", deleteAccountMapping);

// Bulk Excel import with iterative validation
router.post("/import-excel", upload.single("file"), importExcelAccountMappingFCY);

export default router;
