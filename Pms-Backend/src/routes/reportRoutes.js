import express from "express";
import { getUserTargetsReport, getAccountMappingReport, getAccountVariationReport } from "../controllers/reportController.js";

const router = express.Router();

// POST so we can send position/role/team/subprocess/process in body
router.post("/user-targets", getUserTargetsReport);
router.post("/account-mapping", getAccountMappingReport);
router.post("/account-variation", getAccountVariationReport);

export default router;
