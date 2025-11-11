import { Brand } from "../models/brand.js";

const cleanKeywordGroups = (keywordGroups) => {
  if (!keywordGroups || !Array.isArray(keywordGroups)) {
    return [];
  }

  const filtered = keywordGroups.filter((group) => {
    return (
      group &&
      typeof group === "object" &&
      group.name &&
      String(group.name).trim().length > 0
    );
  });

  return filtered
    .map((group) => ({
      name: String(group.name || "").trim(),
      keywords: Array.isArray(group.keywords)
        ? group.keywords
            .map((k) => String(k || "").trim())
            .filter((k) => k.length > 0)
        : [],
      assignedUsers: Array.isArray(group.assignedUsers)
        ? group.assignedUsers
            .map((u) => String(u || "").trim().toLowerCase())
            .filter((u) => u.length > 0)
        : [],
    }))
    .filter((group) => group.name.length > 0);
};

export const createBrand = async (req, res) => {
  try {
    let { brandName, description, frequency } = req.body;

    if (!brandName) {
      return res
        .status(400)
        .json({ success: false, message: "Brand name is required" });
    }

    const normalizedName = String(brandName).trim();

    if (!frequency) frequency = undefined;

    const existing = await Brand.findOne({
      brandName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Brand name already exists" });
    }

    const brand = await Brand.create({
      brandName: normalizedName,
      description,
      frequency,
    });
    res.json({ success: true, brand });
  } catch (err) {
    console.error("Create Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const assignUsersToBrand = async (req, res) => {
  try {
    const { brandName, users = [] } = req.body;

    if (!brandName) {
      return res
        .status(400)
        .json({ success: false, message: "brandName is required" });
    }

    if (!Array.isArray(users)) {
      return res
        .status(400)
        .json({ success: false, message: "users must be an array" });
    }

    const escapedBrandName = String(brandName).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    let brand = await Brand.findOne({
      brandName: { $regex: new RegExp(`^${escapedBrandName}$`, "i") },
    });

    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: `Brand "${brandName}" not found` });
    }

    const normalizedEmails = users
      .map((u) => String(u || "").trim().toLowerCase())
      .filter(Boolean);

    brand.assignedUsers = normalizedEmails;
    brand.keywordGroups = cleanKeywordGroups(brand.keywordGroups);

    await brand.save();

    return res.json({
      success: true,
      message: "Users assigned to brand",
      brand,
      assignedUsers: brand.assignedUsers,
    });
  } catch (err) {
    console.error("Assign Users Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const configureBrand = async (req, res) => {
  try {
    const {
      brandName,
      keywords = [],
      includeKeywords = [],
      excludeKeywords = [],
      platforms = [],
      keywordGroups = [],
      users = [],
      frequency,
      language,
      country,
      description,
      aiFriendlyName,
      brandColor,
      avatarUrl,
      ticketCreation,
    } = req.body;

    if (!brandName) {
      return res
        .status(400)
        .json({ success: false, message: "brandName is required" });
    }

    const brandFilter = {
      brandName: { $regex: new RegExp(`^${brandName}$`, "i") },
    };

    const currentBrand = await Brand.findOne(brandFilter).lean();

    if (!currentBrand) {
      return res
        .status(404)
        .json({ success: false, message: `Brand "${brandName}" not found` });
    }

    const nextKeywords = Array.isArray(keywords)
      ? keywords.map((k) => String(k || "").trim()).filter(Boolean)
      : currentBrand.keywords;
    const nextIncludeKeywords = Array.isArray(includeKeywords)
      ? includeKeywords.map((k) => String(k || "").trim()).filter(Boolean)
      : currentBrand.includeKeywords;
    const nextExcludeKeywords = Array.isArray(excludeKeywords)
      ? excludeKeywords.map((k) => String(k || "").trim()).filter(Boolean)
      : currentBrand.excludeKeywords;
    const nextPlatforms = Array.isArray(platforms)
      ? platforms.map((p) => String(p || "").trim()).filter(Boolean)
      : currentBrand.platforms;

    const nextAssignedUsers = Array.isArray(users)
      ? users
          .map((u) => String(u || "").trim().toLowerCase())
          .filter(Boolean)
      : currentBrand.assignedUsers;

    const nextKeywordGroups = Array.isArray(keywordGroups)
      ? cleanKeywordGroups(keywordGroups)
      : cleanKeywordGroups(currentBrand.keywordGroups);

    const updateDoc = {
      keywords: nextKeywords,
      includeKeywords: nextIncludeKeywords,
      excludeKeywords: nextExcludeKeywords,
      platforms: nextPlatforms,
      assignedUsers: nextAssignedUsers,
      keywordGroups: nextKeywordGroups,
    };

    if (frequency) updateDoc.frequency = frequency;
    if (language) updateDoc.language = language;
    if (country) updateDoc.country = country;
    if (typeof description === "string") updateDoc.description = description.trim();
    if (typeof aiFriendlyName === "string")
      updateDoc.aiFriendlyName = aiFriendlyName.trim();
    if (typeof brandColor === "string") updateDoc.brandColor = brandColor;
    if (typeof avatarUrl === "string") updateDoc.avatarUrl = avatarUrl;
    if (typeof ticketCreation === "boolean")
      updateDoc.ticketCreation = ticketCreation;

    const updatedBrand = await Brand.findOneAndUpdate(
      brandFilter,
      { $set: updateDoc },
      { new: true, runValidators: false }
    );

    console.log('[configureBrand] Returning brand:', {
      brandName: updatedBrand?.brandName,
      hasKeywordGroups: !!updatedBrand?.keywordGroups,
      keywordGroupsLength: updatedBrand?.keywordGroups?.length || 0,
      keywordGroups: updatedBrand?.keywordGroups
    });

    return res.json({ success: true, brand: updatedBrand });
  } catch (err) {
    console.error("Configure Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).lean();

    const ensureKeywordGroups = (brand) => {
      const hasGroups =
        Array.isArray(brand.keywordGroups) && brand.keywordGroups.length > 0;
      const hasKeywords = Array.isArray(brand.keywords) && brand.keywords.length > 0;
      if (hasGroups) return brand;
      if (!hasKeywords) return brand;
      // Return a computed default group for display purposes (do not persist here)
      return {
        ...brand,
        keywordGroups: [
          {
            name: "Default Group",
            keywords: [...brand.keywords],
            assignedUsers: [],
          },
        ],
      };
    };

    const responseBrands = (brands || []).map(ensureKeywordGroups);

    console.log('[getBrands] Returning brands:', responseBrands.map(b => ({
      brandName: b.brandName,
      hasKeywordGroups: !!b.keywordGroups,
      keywordGroupsLength: b.keywordGroups?.length || 0,
      keywordGroupNames: b.keywordGroups?.map(g => g.name) || []
    })));

    res.json({
      success: true,
      count: responseBrands.length,
      brands: responseBrands,
    });
  } catch (err) {
    console.error("Error fetching brands:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBrandsByUser = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email parameter is required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const brands = await Brand.find({
      $or: [
        { assignedUsers: { $elemMatch: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } } },
        {
          "keywordGroups.assignedUsers": {
            $elemMatch: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
          },
        },
      ],
    }).lean();

    const ensureKeywordGroups = (brand) => {
      const hasGroups =
        Array.isArray(brand.keywordGroups) && brand.keywordGroups.length > 0;
      const hasKeywords = Array.isArray(brand.keywords) && brand.keywords.length > 0;
      if (hasGroups) return brand;
      if (!hasKeywords) return brand;
      return {
        ...brand,
        keywordGroups: [
          {
            name: "Default Group",
            keywords: [...brand.keywords],
            assignedUsers: [],
          },
        ],
      };
    };
    const responseBrands = (brands || []).map(ensureKeywordGroups);

    console.log('[getBrandsByUser] Returning brands for', email, ':', responseBrands.map(b => ({
      brandName: b.brandName,
      hasKeywordGroups: !!b.keywordGroups,
      keywordGroupsLength: b.keywordGroups?.length || 0,
      keywordGroupNames: b.keywordGroups?.map(g => g.name) || []
    })));

    res.json({ success: true, brands: responseBrands, count: responseBrands.length });
  } catch (err) {
    console.error("Error fetching brands for user:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAssignedBrands = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const brands = await Brand.find({
      assignedUsers: { $elemMatch: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } },
    }).lean();
    res.json({ success: true, brands, count: brands.length });
  } catch (err) {
    console.error("Error fetching assigned brands:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete brand by exact brandName (case-insensitive)
export const deleteBrand = async (req, res) => {
  try {
    const { brandName } = req.body;
    console.log('[deleteBrand] payload:', req.body);
    if (!brandName) {
      return res
        .status(400)
        .json({ success: false, message: "brandName is required" });
    }
    const escaped = String(brandName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const brand = await Brand.findOne({
      brandName: { $regex: new RegExp(`^${escaped}$`, "i") },
    });
    if (!brand) {
      console.warn('[deleteBrand] brand not found for:', brandName);
      return res
        .status(404)
        .json({ success: false, message: `Brand "${brandName}" not found` });
    }
    await brand.deleteOne();
    console.log('[deleteBrand] deleted:', brandName);
    return res.json({
      success: true,
      message: "Brand deleted",
      brandName: brand.brandName,
      _id: brand._id,
    });
  } catch (err) {
    console.error("Delete Brand Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};