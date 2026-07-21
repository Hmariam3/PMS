import express from "express";
import { getUserTargetsReport, getAccountMappingReport, getAccountVariationReport, getFcyDepositReport, getEvaluationResultReport } from "../controllers/reportController.js";

const router = express.Router();

// POST so we can send position/role/team/subprocess/process in body
router.post("/user-targets", getUserTargetsReport);
router.post("/account-mapping", getAccountMappingReport);
router.post("/account-variation", getAccountVariationReport);
router.post("/fcy-deposit", getFcyDepositReport);
router.post("/evaluation-result", getEvaluationResultReport);

export default router;
