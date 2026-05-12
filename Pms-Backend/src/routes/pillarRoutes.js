import express from "express";
import {
  getPillars,
  getPillarById,
  createPillar,
  updatePillar,
  deletePillar,
} from "../controllers/pillarController.js";

const router = express.Router();

router.get("/", getPillars);
router.get("/:id", getPillarById);
router.post("/", createPillar);
router.put("/:id", updatePillar);
router.delete("/:id", deletePillar);

export default router;
