import express from "express";
import {
  createUser,
  loginUser,
  getUserByuserName,
  getAllUsers,
  getUserByEmail,
  getUserByPostion,
  searchUsers,
  updateUser
} from "../controllers/userController.js";
import { apiKeyMiddleware } from "../middleware/apiKeyMiddleware.js";
const router = express.Router();
router.get("/", getAllUsers);
router.get("/search", searchUsers);
router.post("/createUser/", createUser);
router.post("/getUserByPostion/", getUserByPostion);
router.post("/login/", loginUser);
router.get("/getUserByuserName/:username", getUserByuserName);
router.get("/byEmail/:email", getUserByEmail);
router.put("/:id", updateUser);
export default router;
