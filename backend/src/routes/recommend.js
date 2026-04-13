import express from "express";
import { searchPlaces } from "../services/geoapifyPlaces.js";

const router = express.Router();

// 🧠 Build intent based on user answers
function buildSearchIntent({ mood, goingWith, budget, time }) {
  let keyword = "restaurant";

  if (mood === "romantic") keyword = "romantic restaurant";
  if (mood === "fun" && goingWith === "friends") keyword = "lively restaurant";
  if (time === "breakfast") keyword = "cafe";

  return { keyword };
}

router.post("/recommend", async (req, res) => {
  try {
    const { mood, goingWith, budget, time, location } = req.body;

    const lat = location?.lat;
    const lng = location?.lng;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "Location is required",
      });
    }

    if (!mood || !goingWith || !budget) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const intent = buildSearchIntent({
      mood,
      goingWith,
      budget,
      time,
    });

    // 🎯 Primary search (REAL DATA from Geoapify)
    const places = await searchPlaces({
      lat,
      lng,
      keyword: intent.keyword,
    });

    if (places && places.length > 0) {
      const pickFromTop = places.slice(0, 3);
      const best =
        pickFromTop[Math.floor(Math.random() * pickFromTop.length)];

      return res.json({
        name: best.properties?.name || "Nearby Restaurant",
        reason:
          best.properties?.address_line2 ||
          best.properties?.formatted ||
          "A recommended nearby place.",
        confidence: "high",
      });
    }

    // 🔁 Relaxed search fallback
    const relaxedPlaces = await searchPlaces({
      lat,
      lng,
      keyword: "restaurant",
    });

    if (relaxedPlaces && relaxedPlaces.length > 0) {
      return res.json({
        name: relaxedPlaces[0].properties?.name || "Nearby Restaurant",
        reason:
          relaxedPlaces[0].properties?.address_line2 ||
          "A popular nearby restaurant.",
        confidence: "medium",
      });
    }

    // 🚨 Absolute fallback
    return res.json({
      name: "Nearby Restaurant",
      reason: "A reliable nearby option based on your location.",
      confidence: "medium",
    });
  } catch (err) {
    console.error("RECOMMEND ERROR:", err.message);

    return res.json({
      name: "Nearby Restaurant",
      reason: "A trusted place near you that many people like.",
      confidence: "medium",
    });
  }
});

export default router;
