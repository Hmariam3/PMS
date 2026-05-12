import express from "express";
import {
  getTitles,
  getTitleById,
  createTitle,
  updateTitle,
  deleteTitle
} from "../controllers/titleController.js";

const router = express.Router();

router.get("/", getTitles);
router.get("/:id", getTitleById);
router.post("/", createTitle);
router.put("/:id", updateTitle);
router.delete("/:id", deleteTitle);

export default router;