import dotenv from "dotenv";

// Load environment variables FIRST before any other imports that might use them
dotenv.config();

import { app } from "./app.js";
import { connectToDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Connect to database and start server
async function startServer() {
  try {
    await connectToDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
