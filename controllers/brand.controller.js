import { Brand } from "../models/brand.js";

/* ---------------------------------------------------
   CREATE BRAND (Brand-level metadata only)
--------------------------------------------------- */
export const createBrand = async (req, res) => {
  try {
    const { brandName, description } = req.body;

    if (!brandName)
      return res.status(400).json({ success: false, message: "Brand name is required" });

    const normalizedName = brandName.trim();

    const existing = await Brand.findOne({
      brandName: new RegExp(`^${normalizedName}$`, "i"),
    });

    if (existing)
      return res.status(400).json({ success: false, message: "Brand already exists" });

    const brand = await Brand.create({
      brandName: normalizedName,
      description,
    });

    res.json({ success: true, brand });
  } catch (err) {
    console.error("Create Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------------------------------------------
   ASSIGN USERS TO BRAND (Brand admin users)
--------------------------------------------------- */
export const assignUsersToBrand = async (req, res) => {
  try {
    const { brandName, users = [] } = req.body;

    if (!brandName)
      return res.status(400).json({ success: false, message: "brandName is required" });

    if (!Array.isArray(users))
      return res.status(400).json({ success: false, message: "users must be an array" });

    const brand = await Brand.findOne({
      brandName: new RegExp(`^${brandName}$`, "i"),
    });

    if (!brand)
      return res.status(404).json({ success: false, message: "Brand not found" });

    const normalizedEmails = users.map(u => u.toLowerCase().trim()).filter(Boolean);

    brand.assignedUsers = Array.from(new Set([
      ...brand.assignedUsers,
      ...normalizedEmails
    ]));

    await brand.save();

    res.json({
      success: true,
      message: "Users assigned to brand",
      assignedUsers: brand.assignedUsers,
    });
  } catch (err) {
    console.error("Assign Users Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------------------------------------------
   UPDATE BRAND (Brand metadata only)
--------------------------------------------------- */
export const configureBrand = async (req, res) => {
  try {
    const {
      brandName,
      description,
      aiFriendlyName,
      avatarUrl,
      brandColor,
      ticketCreation,
      assignedUsers,   // REMOVE default ≠ [] (important fix)
      language,
      country,
      active,
    } = req.body;

    if (!brandName)
      return res.status(400).json({ success: false, message: "brandName is required" });

    const brand = await Brand.findOne({
      brandName: new RegExp(`^${brandName}$`, "i"),
    });

    if (!brand)
      return res.status(404).json({ success: false, message: "Brand not found" });

    // -------- Update metadata --------
    if (typeof description === "string") brand.description = description.trim();
    if (typeof aiFriendlyName === "string") brand.aiFriendlyName = aiFriendlyName.trim();
    if (typeof avatarUrl === "string") brand.avatarUrl = avatarUrl;
    if (typeof brandColor === "string") brand.brandColor = brandColor;
    if (typeof ticketCreation === "boolean") brand.ticketCreation = ticketCreation;
    if (typeof language === "string") brand.language = language;
    if (typeof country === "string") brand.country = country;
    if (typeof active === "boolean") brand.active = active;

    // -------- SAFE USER UPDATE --------
    // Only update assignedUsers when array exists AND has values
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      const normalized = assignedUsers
        .map(u => u.toLowerCase().trim())
        .filter(Boolean);

      brand.assignedUsers = Array.from(
        new Set([...brand.assignedUsers, ...normalized])
      );
    }

    await brand.save();

    res.json({
      success: true,
      message: "Brand updated successfully",
      brand,
    });

  } catch (err) {
    console.error("Configure Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------------------------------------------
   GET ALL BRANDS (with keyword groups)
--------------------------------------------------- */
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).lean();
    res.json({ success: true, count: brands.length, brands });
  } catch (err) {
    console.error("getBrands Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------------------------------------------
   GET BRANDS ASSIGNED TO A USER
--------------------------------------------------- */
export const getBrandsByUser = async (req, res) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase().trim();

    const brands = await Brand.find({
      $or: [
        { assignedUsers: normalizedEmail },
        { "keywordGroups.assignedUsers": normalizedEmail }
      ]
    });

    res.json({ success: true, count: brands.length, brands });
  } catch (err) {
    console.error("getBrandsByUser Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------------------------------------------
   DELETE BRAND
--------------------------------------------------- */
export const deleteBrand = async (req, res) => {
  try {
    const { brandName } = req.body;

    const brand = await Brand.findOne({
      brandName: new RegExp(`^${brandName}$`, "i")
    });

    if (!brand)
      return res.status(404).json({ success: false, message: "Brand not found" });

    await brand.deleteOne();

    res.json({
      success: true,
      message: "Brand deleted",
      brandName: brand.brandName,
    });
  } catch (err) {
    console.error("Delete Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------------------------------------------
   ADD KEYWORD GROUP TO BRAND
--------------------------------------------------- */
export const addKeywordGroup = async (req, res) => {
  try {
    const {
      brandName,
      groupName,
      keywords,
      includeKeywords = [],
      excludeKeywords = [],
      platforms = [],
      language = "en",
      country = "IN",
      frequency = "30m",
      assignedUsers = []
    } = req.body;

    if (!brandName || !groupName || !keywords?.length)
      return res.status(400).json({
        success: false,
        message: "brandName, groupName and keywords are required"
      });

    const brand = await Brand.findOne({ brandName });

    if (!brand)
      return res.status(404).json({ success: false, message: "Brand not found" });

    const exists = brand.keywordGroups.find(
      (g) => g.groupName.toLowerCase() === groupName.toLowerCase()
    );

    if (exists)
      return res.status(400).json({
        success: false,
        message: `Keyword group '${groupName}' already exists`
      });

    brand.keywordGroups.push({
      groupName,
      keywords,
      includeKeywords,
      excludeKeywords,
      platforms,
      language,
      country,
      frequency,
      assignedUsers,
      status: "running",
      lastRun: null,
      nextRun: new Date()
    });

    await brand.save();

    res.json({
      success: true,
      message: "Keyword group added successfully",
      brand
    });
  } catch (err) {
    console.error("Add Keyword Group Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
