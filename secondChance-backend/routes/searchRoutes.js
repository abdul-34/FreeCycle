const express = require("express");
const router = express.Router();
const { connectToDatabase } = require("../models/db");

// Search for gifts
router.get("/", async (req, res, next) => {
  let client;
  try {
    const { db, client: connectedClient } = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    client = connectedClient;
    // Initialize the query object
    let query = [];

    if (req.query.name && req.query.name.trim() !== "") {
      // {$regex: "curtain"->find the name using query,$options: "i-> Tells case in-sensitive"}
      query.push({ name: { $regex: req.query.name, $options: "i" } }); // Using regex for partial match, case-insensitive
    }

    if (req.query.category) {
      query.push({ category: req.query.category }); // Using regex for partial match, case-insensitive
    }
    if (req.query.condition) {
      query.push({ condition: req.query.conditio }); // Using regex for partial match, case-insensitive
    }
    if (req.query.age_years) {
      query.push({ age_years: { $lte: parseInt(req.query.age_years) } });
    }

    let finalQuery = query.length ? { $or: query } : {};

    const gifts = await collection.find(finalQuery).toArray();
    res.json(gifts);
  } catch (e) {
    next(e);
  } finally {
    if (client) {
      await client.close();
    }
  }
});

module.exports = router;
