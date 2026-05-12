import express from "express";
import {
  getAllQuarterOKR,
  getQuarterOKRByUser,
  getQuarterOKRById,
  createQuarterOKR,
  updateQuarterOKR,
  deleteQuarterOKR,
} from "../controllers/quarterOKRController.js";

const router = express.Router();

router.get("/", getAllQuarterOKR);
router.post("/user", getQuarterOKRByUser);
router.get("/:id", getQuarterOKRById);
router.post("/", createQuarterOKR);
router.put("/:id", updateQuarterOKR);
router.delete("/:id", deleteQuarterOKR);

export default router;
