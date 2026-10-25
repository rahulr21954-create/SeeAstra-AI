
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "https://seeastra-ai.onrender.com",
  // Yahan apne deployed frontend ka exact URL add karo
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header, such as server-to-server
      // requests or some health checks, are allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "SeeAstra AI Backend",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    service: "backend",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/workflow", workflowRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
