import express from "express";
import {
  getAllPriorities,
  getPriorityById,
  createPriority,
  updatePriority,
  deletePriority,
  getPriorityByUser,
  getUsersWithoutPriority,
} from "../controllers/priorityController.js";

const router = express.Router();
router.get("/", getAllPriorities);
router.get("/:id", getPriorityById);
router.post("/", createPriority);
router.post("/getPriorityByUser/", getPriorityByUser);
router.post("/getUsersWithoutPriority/", getUsersWithoutPriority);
router.put("/:id", updatePriority);
router.delete("/:id", deletePriority);
export default router;
