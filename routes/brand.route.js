import express from "express";
import {
  createBrand,
  configureBrand,
  assignUsersToBrand,
  getBrands,
  getBrandsByUser,
  deleteBrand,
  getAssignedBrands,
} from "../controllers/brand.controller.js";
import { protect, isAdmin } from "../middleware/auth.js";
import { canManageBrand } from "../middleware/brandAccess.js";

const router = express.Router();

router.post("/create", protect, isAdmin, createBrand);
router.get("/all", protect, isAdmin, getBrands);
router.post("/assign-users", protect, isAdmin, assignUsersToBrand);
router.post("/delete", protect, isAdmin, deleteBrand);

router.post("/configure", protect, canManageBrand, configureBrand);

router.get("/user/:email", protect, getBrandsByUser);
router.get("/assigned/:email", protect, getAssignedBrands);

export default router;
