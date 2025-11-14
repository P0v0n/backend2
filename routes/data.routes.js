import express from "express";
import {
//   getDataByKeyword,
//   getAllKeywords,
  getUserSocialPosts
} from "../controllers/data.controller.js";
import { protect } from "../middleware/auth.js";
import { refreshDB } from "../controllers/dashboard.controllers.js";

const router = express.Router();

// router.get("/data", getDataByKeyword);
// router.get("/data/keywords", getAllKeywords);
router.get("/user-posts", getUserSocialPosts); 

//refresh dashboard
router.get('/get-data' , protect , refreshDB)

export default router;