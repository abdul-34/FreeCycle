const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { connectToDatabase } = require("../models/db");
const logger = require("../logger");

// Define the upload directory path
const directoryPath = "public/images";

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get("/", async (req, res, next) => {
  let client;
  try {
    //Step 2: task 1 - insert code here
    const { db, client: connectedClient } = await connectToDatabase();
    client = connectedClient;
    //Step 2: task 2 - insert code here
    const collection = db.collection("secondChanceItems");
    //Step 2: task 3 - insert code here
    const secondChanceItems = await collection.find({}).toArray();
    //Step 2: task 4 - insert code here
    res.status(200).json(secondChanceItems);
  } catch (e) {
    console.error(e);
    // logger.console.error("oops something went wrong", e);
    next(e);
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Add a new item
router.post("/", upload.single("file"), async (req, res, next) => {
  let client;
  try {
    // Connect to database
    const { db, client: connectedClient } = await connectToDatabase();
    client = connectedClient;

    // Go to collection
    const collection = db.collection("secondChanceItems");

    // Get data from request
    let secondChanceItem = req.body;

    // Find the last item in the collection
    const lastItem = await collection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    // Increment id of the last item
    if (lastItem.length > 0) {
      secondChanceItem.id = (parseInt(lastItem[0].id) + 1).toString();
    } else {
      secondChanceItem.id = "1"; // Set initial id if the collection is empty
    }

    // Add new date to each item
    const date_added = Math.floor(new Date().getTime() / 1000);
    secondChanceItem.date_added = date_added;

    // Insert data into database
    const result = await collection.insertOne(secondChanceItem);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Get a single secondChanceItem by ID
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  let client;
  try {
    const { db, client: connectedClient } = await connectToDatabase();
    client = connectedClient;
    // go to collection
    const collection = db.collection("secondChanceItems");
    const secondChanceItem = await collection.findOne({ id: id });
    if (!secondChanceItem) {
      return res.status(404).send("secondChanceItem not found");
    }
    res.status(201).json(secondChanceItem);
  } catch (e) {
    next(e);
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Update and existing item
router.put("/:id", async (req, res, next) => {
  const { id } = req.params;
  const { category, condition, age_days, description } = req.body;
  let client;
  try {
    //Step 2: task 1 - insert code here
    const { db, client: connectedClient } = await connectToDatabase();
    client = connectedClient;
    // go to collection
    const collection = db.collection("secondChanceItems");
    let secondChanceItem = await collection.findOne({ id });
    if (!secondChanceItem) {
      return res.status(404).send("secondChanceItem not found");
    }

    const updatedItem = await collection.findOneAndUpdate(
      { id },
      {
        $set: {
          category,
          condition,
          age_days,
          description,
          age_years: Number(age_days / 365).toFixed(1),
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    res.status(200).json(updatedItem);
  } catch (e) {
    next(e);
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Delete an existing item
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  let client;
  try {
    //Step 2: task 1 - insert code here
    const { db, client: connectedClient } = await connectToDatabase();
    client = connectedClient;
    // go to collection
    const collection = db.collection("secondChanceItems");
    let secondChanceItem = await collection.findOne({ id });
    if (!secondChanceItem) {
      return res.status(404).send("secondChanceItem not found");
    }
    const deleteItem = await collection.deleteOne({ id });
    if (!deleteItem) {
      return res.status(404).send("secondChanceItem not deleted");
    }
    res.status(204).json({ message: "secondChanceItem successfully deleted" });
  } catch (e) {
    next(e);
  } finally {
    if (client) {
      await client.close();
    }
  }
});

module.exports = router;
