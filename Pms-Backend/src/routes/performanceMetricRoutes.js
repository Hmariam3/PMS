import express from "express";
import {
  getMetrics,
  getMetricById,
  createMetric,
  updateMetric,
  deleteMetric,
  getMetricsByTitle,
  getMetricsByTitleName,
} from "../controllers/performanceMetricController.js";

const router = express.Router();

router.get("/", getMetrics);
router.get("/bytitle/:title_id/:branch_grade", getMetricsByTitle);

router.get(
  "/bytitleName/:title_name/:branch_grade",
  getMetricsByTitleName
);
router.get("/:id", getMetricById);
router.post("/", createMetric);
router.put("/:id", updateMetric);
router.delete("/:id", deleteMetric);


export default router;
