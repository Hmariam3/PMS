import express from "express";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  validateBranchCode,
  getBranchByCode,
} from "../controllers/branchController.js";

const router = express.Router();

router.get("/", getBranches);
router.get("/:id", getBranchById);
router.post("/createBranch/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);
router.post("/validate-code", validateBranchCode);
router.get("/getBranchByCode/:branch_code", getBranchByCode);
export default router;
