import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import instagramRoutes from "./routes/instagram.routes.js";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: new URL(`.env.${process.env.NODE_ENV || 'development'}`, import.meta.url) });
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') }));
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
