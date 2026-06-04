import express from "express";
import { getUserTargetsReport } from "../controllers/reportController.js";

const router = express.Router();

// POST so we can send position/role/team/subprocess/process in body
router.post("/user-targets", getUserTargetsReport);

export default router;
