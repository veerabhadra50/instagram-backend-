import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import instagramRoutes from "./routes/instagram.routes.js";

dotenv.config({ path: new URL('.env', import.meta.url) });

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/instagram", instagramRoutes);

// Proxy for Instagram images (avoids CORS block)
app.get("/proxy-image", async (req, res) => {
  try {
    const url = decodeURIComponent(req.query.url);
    const axios = (await import("axios")).default;
    const response = await axios.get(url, { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } });
    res.set("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.send(response.data);
  } catch {
    res.status(404).send("Image not found");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});