import express from "express";
import {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getByUserFeedbacks,
  replyFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();
router.post("/", createFeedback);
router.get("/", getFeedbacks);
router.get("/:id", getFeedbackById);
router.get("/getByUserFeedbacks/:user_name", getByUserFeedbacks);
router.put("/reply/:id", replyFeedback);
router.put("/:id", updateFeedback);
router.delete("/:id", deleteFeedback);
export default router;
