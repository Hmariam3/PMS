import express from "express";
import multer from "multer";
import {
  downloadMetricTemplate,
  uploadMetricsFromExcel,
  uploadAutomatedMetrics
} from "../controllers/metricUploadController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/template", downloadMetricTemplate);
router.post("/upload", upload.single("file"), uploadMetricsFromExcel);
router.post("/automate", upload.single("file"), uploadAutomatedMetrics);

export default router;
