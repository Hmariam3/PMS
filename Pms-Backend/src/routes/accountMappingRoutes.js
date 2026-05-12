import express from "express";
import {
  getAllAccountMappings,
  getAccountMappingById,
  createAccountMapping,
  updateAccountMapping,
  deleteAccountMapping,
  getBalanceDifferenceByUser,
  getAccountMappingsByUser,
  importExcelAccountMapping,
} from "../controllers/accountMappingController.js";
import { upload } from "../middleware/upload.js";
const router = express.Router();
router.get("/", getAllAccountMappings);
router.get("/:id", getAccountMappingById);
router.post("/", createAccountMapping);
router.post("/getBalanceDifference/", getBalanceDifferenceByUser);
router.post("/getAccountMappingsByUser/", getAccountMappingsByUser);
router.put("/:id", updateAccountMapping);
router.delete("/:id", deleteAccountMapping);

// Bulk Excel import with iterative validation
router.post("/import-excel", upload.single("file"), importExcelAccountMapping);

export default router;