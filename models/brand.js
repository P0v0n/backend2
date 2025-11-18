// models/brand.js
import mongoose from "mongoose";

const keywordGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    keywords: [{ type: String }],
    includeKeywords: [{ type: String }],
    excludeKeywords: [{ type: String }],
    assignedUsers: [{ type: String }],
    platforms: [{ type: String }],
    language: { type: String },
    country: { type: String },
    frequency: { type: String },
    paused: { type: Boolean, default: false },
  },
  { _id: false }
);

const brandSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true, unique: true },
    description: { type: String },
    aiFriendlyName: { type: String },
    avatarUrl: { type: String },
    brandColor: { type: String },
    ticketCreation: { type: Boolean, default: false },

    keywords: { type: [String], default: [] },
    includeKeywords: { type: [String], default: [] },
    excludeKeywords: { type: [String], default: [] },

    keywordGroups: { type: [keywordGroupSchema], default: [] },
    assignedUsers: { type: [String], default: [] },

    platforms: { type: [String], default: [] },

    language: { type: String, default: "en" },
    country: { type: String, default: "IN" },
    // Monitoring frequency (cron-like short units)
    // Extended to support more options used by the UI
    frequency: { type: String, enum: ["5m", "10m", "15m", "30m", "1h", "2h"], default: "30m" },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = mongoose.model("Brand", brandSchema);
