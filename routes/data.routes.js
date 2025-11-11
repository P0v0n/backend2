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

export default router;