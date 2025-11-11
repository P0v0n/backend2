import express from "express";
import cors from "cors";

// Import routes
import searchRoutes from "./routes/search.route.js";
import brandRoutes from "./routes/brand.route.js";
import authRoutes from "./routes/auth.route.js";
import dataRoutes from "./routes/data.routes.js";
import usersRoutes from "./routes/users.route.js";
import { protect } from "./middleware/auth.js";

const app = express();

// Middleware
// Body parser size limit configurable via env var to avoid "PayloadTooLargeError"
// Default is kept small to avoid accidental DoS from huge requests.
const BODY_PARSER_LIMIT = process.env.BODY_PARSER_LIMIT || "1mb";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000");
const allowedOriginList = allowedOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOriginList.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Parse JSON and URL-encoded bodies with configurable size limits.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Routes
app.use("/api/search", searchRoutes);

// Optional: Health check route
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});


app.use("/api/brands", brandRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/data", protect, dataRoutes);

// Error handler for oversized payloads and other body parsing errors
app.use((err, req, res, next) => {
  // raw-body/body-parser sets err.type === 'entity.too.large' for oversized payloads
  if (err) {
    const isPayloadTooLarge =
      (err.type && err.type === "entity.too.large") ||
      err.status === 413 ||
      err.statusCode === 413 ||
      (err.message && /request entity too large/i.test(err.message));

    if (isPayloadTooLarge) {
      return res.status(413).json({
        success: false,
        message:
          "Payload too large. Increase the server body parser limit (BODY_PARSER_LIMIT) or send smaller requests (use multipart uploads for files).",
      });
    }
  }
  // Delegate to default Express error handler if not handled here
  next(err);
});

export { app };
