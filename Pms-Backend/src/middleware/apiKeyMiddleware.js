// middleware/apiKeyMiddleware.js
import pool from "../db.js";
export async function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  // 1️⃣ Check if API key is provided
  if (!apiKey) return res.status(401).json({ message: "API Key missing" });
  try {
    const result = await pool.query(
      "SELECT * FROM api_keys WHERE api_key = $1 AND is_active = TRUE",
      [apiKey],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid API Key" });
    }
    req.client = result.rows[0];
    next(); // allow request to continue
  } catch (err) {
    console.error("API key validation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
}
