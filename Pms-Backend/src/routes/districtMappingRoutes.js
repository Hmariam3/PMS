import express from "express";
import {
  getAllDistrictMappings,
  getDistrictMappingsByUser,
  createDistrictMapping,
  updateDistrictMapping,
  deleteDistrictMapping,
  getDistrictsFromSubprocesses,
  getTargetsAndDepositByDistricts,
  getMappedDistrictsByUser,
} from "../controllers/districtMappingController.js";

const router = express.Router();

router.get("/", getAllDistrictMappings);
router.get("/getDistricts", getDistrictsFromSubprocesses);
router.post("/getDistrictMappingsByUser", getDistrictMappingsByUser);
router.post("/", createDistrictMapping);
router.put("/:id", updateDistrictMapping);
router.delete("/:id", deleteDistrictMapping);

router.post("/getMappedDistrictsByUser/:user_name", getMappedDistrictsByUser);
router.post("/getTargetsAndDepositByDistricts", getTargetsAndDepositByDistricts);


export default router;
