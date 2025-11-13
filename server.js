import dotenv from "dotenv";
import { app } from "./app.js";
import { connectToDB } from "./config/db.js";
dotenv.config();

const PORT = process.env.PORT || 5050;
connectToDB().then(() => console.log("✅ Connected to MongoDB"));
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
