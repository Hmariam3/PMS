// routes/processRoutes.js
import express from "express";
import {
  getProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
} from "../controllers/processController.js";

const router = express.Router();
router.get("/", getProcesses);
router.get("/:id", getProcessById);
router.post("/createProcess", createProcess);
router.put("/:id", updateProcess);
router.delete("/:id", deleteProcess);
export default router;
