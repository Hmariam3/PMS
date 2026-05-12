import express from "express";
import {
  getAllNonDepositTargets,
  getNonDepositTargetById,
  createNonDepositTarget,
  updateNonDepositTarget,
  deleteNonDepositTarget,
  getNonDepositTargetByUser,
  getNonDepositSummaryByUser,
  approveTarget
} from "../controllers/nonDepositTargetController.js";

const router = express.Router();

router.get("/", getAllNonDepositTargets);
router.get("/:id", getNonDepositTargetById);
router.post("/", createNonDepositTarget);
router.put("/:id", updateNonDepositTarget);
router.put("/approvenondepositTarget/:id", approveTarget);
router.delete("/:id", deleteNonDepositTarget);

router.post("/by-user", getNonDepositTargetByUser);
router.post("/summary", getNonDepositSummaryByUser);

export default router;
