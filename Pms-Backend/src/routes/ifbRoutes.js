import express from "express";
import {
  getAllIFB,
  getIFBById,
  createIFB,
  updateIFB,
  deleteIFB,
  getIFBBalanceDifferenceByUser,
} from "../controllers/ifbController.js";

const router = express.Router();
router.get("/", getAllIFB);
router.get("/:id", getIFBById);
router.post("/", createIFB);
router.post("/ifbBalanceDifference/", getIFBBalanceDifferenceByUser);
router.put("/:id", updateIFB);
router.delete("/:id", deleteIFB);
export default router;
