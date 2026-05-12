import express from "express";
import {
  getBranchGrades,
  getBranchGradeById,
  createBranchGrade,
  updateBranchGrade,
  deleteBranchGrade,
} from "../controllers/branchGradeController.js";

const router = express.Router();
router.get("/branch-grades", getBranchGrades);
router.get("/branch-grades/:id", getBranchGradeById);
router.post("/branch-grades", createBranchGrade);
router.put("/branch-grades/:id", updateBranchGrade);
router.delete("/branch-grades/:id", deleteBranchGrade);
export default router;
