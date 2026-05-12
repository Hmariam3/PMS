import express from "express";
import {
  getAllBAU,
  getBAUByUser,
  getBAUById,
  createBAU,
  updateBAU,
  deleteBAU,
} from "../controllers/businessAsUsualController.js";

const router = express.Router();

router.get("/", getAllBAU);
router.post("/user", getBAUByUser);
router.get("/:id", getBAUById);
router.post("/", createBAU);
router.put("/:id", updateBAU);
router.delete("/:id", deleteBAU);

export default router;
