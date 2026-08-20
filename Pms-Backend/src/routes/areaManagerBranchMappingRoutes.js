import express from "express";
import {
  getDistricts,
  getAreaManagersByDistrict,
  getBranchesByDistrict,
  getMappingByAreaManager,
  assignBranch,
  removeBranchAssignment
} from "../controllers/areaManagerBranchMappingController.js";

const router = express.Router();

router.get("/districts", getDistricts);
router.get("/area-managers/:district_name", getAreaManagersByDistrict);
router.get("/branches/:district_id", getBranchesByDistrict);
router.get("/mapping/:area_manager_user_id", getMappingByAreaManager);
router.post("/", assignBranch);
router.delete("/:id", removeBranchAssignment);

export default router;
