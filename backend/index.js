import express from "express";
import cors from "cors";
import recommendRoutes from "./src/routes/recommend.js";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ ONLY ONE recommendation route (Foursquare)
app.use("/api", recommendRoutes);

app.get("/", (req, res) => {
  res.send("DecideForUs Backend is running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
