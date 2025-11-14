// models/brand.js
import mongoose from "mongoose";

const keywordGroupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },

    keywords: [{ type: String, required: true }],
    includeKeywords: [{ type: String, default: [] }],
    excludeKeywords: [{ type: String, default: [] }],

    platforms: [{ type: String, enum: ["youtube", "twitter", "reddit", "facebook", "instagram"] }],

    assignedUsers: [{ type: String }],

    language: { type: String, default: "en" },
    country: { type: String, default: "IN" },

    frequency: {
      type: String,
      enum: ["5m", "10m", "15m", "30m", "1h", "2h"],
      default: "30m",
    },

    status: {
      type: String,
      enum: ["running", "paused"],
      default: "running",
    },

    lastRun: { type: Date },
    nextRun: { type: Date },
  },
  { _id: true }
);

const brandSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true, unique: true },
    description: { type: String },

    avatarUrl: { type: String },
    brandColor: { type: String },
    aiFriendlyName: { type: String },
    ticketCreation: { type: Boolean, default: false },

    keywordGroups: [keywordGroupSchema],

    assignedUsers: [{ type: String }],

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = mongoose.model("Brand", brandSchema);
