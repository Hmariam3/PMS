import express from "express";
import {
  getAllTargets,
  getTargetById,
  createTarget,
  updateTarget,
  deleteTarget,
  getTargetByUser,
  getTargetsSummaryByUser,
  approveTarget
} from "../controllers/targetsController.js";

const router = express.Router();
router.get("/", getAllTargets);
router.get("/:id", getTargetById);
router.post("/", createTarget);
router.post("/getTargetByUser/", getTargetByUser);
router.post("/TargetsSummary/", getTargetsSummaryByUser);
router.put("/:id", updateTarget);
router.delete("/:id", deleteTarget);
router.put("/targetsapprove/:id", approveTarget);
export default router;
