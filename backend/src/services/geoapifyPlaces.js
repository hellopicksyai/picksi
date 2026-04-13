import axios from "axios";

export async function searchPlaces({ lat, lng, keyword }) {
  try {
    const response = await axios.get(
      "https://api.geoapify.com/v2/places",
      {
        params: {
          categories: "catering.restaurant",
          filter: `circle:${lng},${lat},3000`,
          bias: `proximity:${lng},${lat}`,
          limit: 10,
          apiKey: process.env.GEOAPIFY_API_KEY,
        },
      }
    );

    return response.data.features || [];
  } catch (err) {
    console.error("Geoapify error:", err.message);
    return [];
  }
}
