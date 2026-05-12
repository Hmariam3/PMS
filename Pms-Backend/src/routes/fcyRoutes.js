import express from "express";
import {
  getAllFcyCollections,
  getFcyById,
  createFcy,
  updateFcy,
  deleteFcy,
  getFcyByUser,
  getFcyBalanceDifferenceByUser
} from "../controllers/fcyController.js";

const router = express.Router();

/* =========================
   BASIC CRUD ROUTES
========================= */
router.get("/", getAllFcyCollections);
router.get("/:id", getFcyById);
router.post("/", createFcy);
router.post("/fcyBalanceDifference/", getFcyBalanceDifferenceByUser);
router.put("/:id", updateFcy);
router.delete("/:id", deleteFcy);

/* =========================
   ROLE BASED ROUTE
========================= */
router.post("/getFcyByUser", getFcyByUser);

export default router;
