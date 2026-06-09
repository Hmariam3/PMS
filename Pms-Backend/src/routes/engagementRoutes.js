import express from "express";
import {
  getAllEngagements,
  getEngagementsByUser,
  createEngagement,
  updateEngagement,
  deleteEngagement,
  approveEngagement,
} from "../controllers/engagementController.js";

const router = express.Router();

router.get("/", getAllEngagements);
router.post("/getEngagementsByUser", getEngagementsByUser);
router.post("/", createEngagement);
router.put("/:id", updateEngagement);
router.delete("/:id", deleteEngagement);
router.put("/:id/approve", approveEngagement);


export default router;
