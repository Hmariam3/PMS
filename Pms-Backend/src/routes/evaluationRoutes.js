// routes/evaluationRoutes.js
import express from "express";
import {
  getEvaluations,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEvaluationsByUserObjective,
  getEvaluationsByEvaluator,
  getByEvaluatedUser,
  agreeEvaluation,
} from "../controllers/performanceEvaluationController.js";

const router = express.Router();

// GET all evaluations
router.post("/", getEvaluations);

// POST create a new evaluation
router.post("/createEvaluation/", createEvaluation);
router.post("/getByEvaluator", getEvaluationsByEvaluator);
router.post("/getByEvaluatedUser", getByEvaluatedUser);
router.post("/agree", agreeEvaluation);
// PUT update an evaluation by ID
router.put("/:id", updateEvaluation);

// DELETE an evaluation by ID
router.delete("/:id", deleteEvaluation);
router.get("/Evaluation/:userId", getEvaluationsByUserObjective);
export default router;
