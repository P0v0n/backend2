import express from "express";
import {
//   getDataByKeyword,
//   getAllKeywords,
  getUserSocialPosts
} from "../controllers/data.controller.js";

const router = express.Router();

// router.get("/data", getDataByKeyword);
// router.get("/data/keywords", getAllKeywords);
router.get("/user-posts", getUserSocialPosts);

// New endpoint with alternative path - uses same controller
router.get("/get-data", getUserSocialPosts);
router.get("/get-data/", getUserSocialPosts);

export default router;