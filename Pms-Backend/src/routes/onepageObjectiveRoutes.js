import express from "express";
import {
  getOnePageObjectives,
  getOnePageObjectiveById,
  createOnePageObjective,
  updateOnePageObjective,
  deleteOnePageObjective,
  getObjectivesByUser,
} from "../controllers/onepageObjectiveController.js";
const router = express.Router();
router.get("/", getOnePageObjectives);
router.get("/:id", getOnePageObjectiveById);
router.post("/", createOnePageObjective);
router.put("/:id", updateOnePageObjective);
router.delete("/:id", deleteOnePageObjective);
router.post("/by-user", getObjectivesByUser);
export default router;