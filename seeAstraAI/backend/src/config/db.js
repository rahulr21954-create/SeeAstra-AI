
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      "MONGODB_URI missing. Check backend/.env"
    );
  }

  // Validate MongoDB URI format
  let parsedUri;

  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error(
      "Invalid MongoDB URI format. Copy a fresh URI from MongoDB Atlas."
    );
  }

  if (
    !["mongodb:", "mongodb+srv:"].includes(parsedUri.protocol) ||
    !parsedUri.hostname
  ) {
    throw new Error(
      "Invalid MongoDB protocol or hostname."
    );
  }

  if (
    parsedUri.hostname.includes("<") ||
    parsedUri.hostname.includes(">") ||
    parsedUri.username.includes("<") ||
    parsedUri.username.includes(">") ||
    parsedUri.password.includes("<") ||
    parsedUri.password.includes(">")
  ) {
    throw new Error(
      "MongoDB URI still contains placeholder characters."
    );
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.name);
    console.error("Reason:", error.message);
    throw error;
  }
}
