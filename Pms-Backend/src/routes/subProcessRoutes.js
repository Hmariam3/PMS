import express from "express";
import {
  getSubProcesses,
  getSubProcessById,
  createSubProcess,
  updateSubProcess,
  deleteSubProcess,
} from "../controllers/subProcessController.js";

const router = express.Router();

router.get("/", getSubProcesses);
router.get("/:id", getSubProcessById);
router.post("/createSubProcess", createSubProcess);
router.put("/:id", updateSubProcess);
router.delete("/:id", deleteSubProcess);

export default router;