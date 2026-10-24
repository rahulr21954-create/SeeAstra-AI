
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(
        `SeeAstra AI backend running at http://localhost:${PORT}`
      );
    });

    return server;
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();
