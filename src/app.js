import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import instagramRoutes from "./routes/instagram.routes.js";

// Load .env files only in non-production (Docker injects env vars directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: new URL('../.env.development', import.meta.url) });
  dotenv.config({ path: new URL('.env', import.meta.url) });
}

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow anyway in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use("/api/instagram", instagramRoutes);

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

app.get("/", (req, res) => res.send("API running 🚀"));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
