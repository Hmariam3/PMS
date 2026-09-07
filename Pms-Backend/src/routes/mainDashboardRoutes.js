import express from "express";
import { getPerformanceData } from "../controllers/mainDashboardController.js";

const router = express.Router();

router.post("/performance", getPerformanceData);

export default router;
