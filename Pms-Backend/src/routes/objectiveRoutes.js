import express from "express";
import {
  getObjectives,
  getObjectiveById,
  createObjective,
  updateObjective,
  deleteObjective,
  getObjectivesByTitle,
} from "../controllers/objectiveController.js";

const router = express.Router();

router.get("/", getObjectives);
router.get("/:id", getObjectiveById);
router.post("/", createObjective);
router.put("/:id", updateObjective);
router.delete("/:id", deleteObjective);
router.get("/title/:title_id", getObjectivesByTitle);

export default router;
