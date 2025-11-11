import { Brand } from "../models/brand.js";
import { SocialPost } from "../models/data.js";

/**
 * Fetch all social posts belonging to brands assigned to a specific user.
 * - You can filter by `brandName` if desired.
 * - Supports pagination and platform filters.
 */
export const getUserSocialPosts = async (req, res) => {
  try {
    const {
      email,                // user's email (required)
      brandName,            // optional - filter by specific brand
      platform,             // optional - twitter, youtube, reddit...
      limit = 20,           // pagination
      page = 1,             // pagination
      sort = "desc"         // sort by newest first
    } = req.query;

    if (!email)
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });

    // Normalize email for case-insensitive matching
    const normalizedEmail = String(email).toLowerCase().trim();
    console.log(`[getUserSocialPosts] Searching for email: "${normalizedEmail}"`);

    // 🔍 Step 1: find all brands assigned to this user (case-insensitive)
    // Get all brands and filter in memory for case-insensitive matching
    const allBrands = await Brand.find({}).select("_id brandName assignedUsers keywordGroups");
    
    const userBrands = allBrands.filter(brand => {
      const directMatch = (brand.assignedUsers || []).some(
        u => String(u).toLowerCase() === normalizedEmail
      );
      const groupMatch = (brand.keywordGroups || []).some(group => 
        (group.assignedUsers || []).some(
          u => String(u).toLowerCase() === normalizedEmail
        )
      );
      return directMatch || groupMatch;
    });

    console.log(`[getUserSocialPosts] Found ${userBrands.length} brands for email "${normalizedEmail}"`);

    if (!userBrands.length)
      return res.status(404).json({
        success: false,
        message: "No brands assigned to this user"
      });

    // build brandId filter
    let brandFilter = userBrands.map((b) => b._id);

    if (brandName) {
      const selectedBrand = userBrands.find(
        (b) => b.brandName.toLowerCase() === brandName.toLowerCase()
      );
      if (!selectedBrand)
        return res.status(400).json({
          success: false,
          message: `Brand '${brandName}' is not assigned to this user`
        });
      brandFilter = [selectedBrand._id];
    }

    // 🔍 Step 2: query SocialPosts
    const filter = { brand: { $in: brandFilter } };
    if (platform) filter.platform = platform;

    const sortOrder = sort === "asc" ? 1 : -1;
    const posts = await SocialPost.find(filter)
      .populate("brand", "brandName")
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();

    res.json({
      success: true,
      user: email,
      brandFilter:
        brandName || userBrands.map((b) => b.brandName),
      count: posts.length,
      totalBrands: userBrands.length,
      data: posts
    });
  } catch (err) {
    console.error("Error fetching user social posts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


