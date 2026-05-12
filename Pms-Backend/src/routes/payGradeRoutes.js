import express from "express";
import {
  getPayGrades,
  getPayGradeById,
  createPayGrade,
  updatePayGrade,
  deletePayGrade,
} from "../controllers/payGradeController.js";

const router = express.Router();

router.get("/", getPayGrades);
router.get("/:id", getPayGradeById);
router.post("/createPayGrade/", createPayGrade);
router.put("/:id", updatePayGrade);
router.delete("/:id", deletePayGrade);

export default router;