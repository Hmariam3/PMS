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
  searchAccountMappingsByUser,
  getBalanceDifferenceByUserforManagers,
} from "../controllers/accountMappingController.js";
import { upload } from "../middleware/upload.js";
const router = express.Router();
router.get("/", getAllAccountMappings);
router.get("/:id", getAccountMappingById);
router.post("/", createAccountMapping);
router.post("/getBalanceDifference/", getBalanceDifferenceByUser);
router.post("/getAccountMappingsByUser/", getAccountMappingsByUser);
router.post("/searchByUser", searchAccountMappingsByUser);
router.put("/:id", updateAccountMapping);
router.delete("/:id", deleteAccountMapping);
router.post("/getBalanceDifferenceByUserforManagers", getBalanceDifferenceByUserforManagers);
// Bulk Excel import with iterative validation
router.post("/import-excel", upload.single("file"), importExcelAccountMapping);

export default router;