import express from "express";
import { getBranchVitalSummaryByBranch } from "../controllers/branchVitalController.js";
const router = express.Router();
/* =========================================================
   BRANCH VITAL SUMMARY BY BRANCH CODE
========================================================= */
router.post("/branch-vital-summary", getBranchVitalSummaryByBranch);
export default router;