require("dotenv").config();
const express = require("express");
const router = express.Router();
const { connectToDatabase } = require("../models/db");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  let client;
  try {
    //  Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const { db, client: connectedClient } = await connectToDatabase();
    //  Access MongoDB `users` collection
    const collection = db.collection("users");
    //  Check if user credentials already exists in the database and throw an error if they do
    client = connectedClient;
    const user = await collection.findOne({ email: email });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }
    // Create a hash to encrypt the password so that it is not readable in the database
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    // Insert the user into the database
    const newUser = await collection.insertOne({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      created_at: new Date(),
    });
    // Create JWT authentication if passwords match with user._id as payload
    let payload = {
      user: {
        id: newUser.insertedId,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    // Return the user email and the token as a JSON
    res.status(200).json({ newUser, token });
  } catch (e) {
    return res.status(500).send("Internal server error");
  } finally {
    if (client) {
      await client.close();
    }
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let client;
  try {
    //  Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const { db, client: connectedClient } = await connectToDatabase();
    //  Access MongoDB `users` collection
    const collection = db.collection("users");
    //  Check if user credentials not exists in the database and throw an error if they do
    client = connectedClient;
    const user = await collection.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Create a hash to encrypt the password so that it is not readable in the database
    const isMatchedPassword = await bcryptjs.compare(password, user?.password);
    if (!isMatchedPassword) {
      return res.status(409).json({ message: "Password is not matched" });
    }

    let payload = {
      user: {
        id: user._id.toString(),
      },
    };
    // Create JWT authentication if passwords match with user._id as payload
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    // Return the user email and the token as a JSON
    res.status(200).json({ user, token });
  } catch (e) {
    return res.status(500).send("Internal server error");
  } finally {
    if (client) {
      await client.close();
    }
  }
});
router.put("/update", async (req, res) => {
  const updatedFields = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error("Validation errors in update request", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  let client;
  try {
    const email = req.headers.email;

    if (!email) {
      logger.error("Email not found in the request headers");
      return res
        .status(400)
        .json({ error: "Email not found in the request headers" });
    }
    //  Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const { db, client: connectedClient } = await connectToDatabase();
    //  Access MongoDB `users` collection
    const collection = db.collection("users");
    //  Check if user credentials not exists in the database and throw an error if they do
    client = connectedClient;
    const existingUser = await collection.findOne({ email: email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await collection.findOneAndUpdate(
      { email: email },
      {
        $set: updatedFields,
      },
      { returnDocument: "after" }
    );
    let payload = {
      user: {
        id: updatedUser._id.toString(),
      },
    };
    // Create JWT authentication if passwords match with user._id as payload
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    // Return the user email and the token as a JSON
    res.status(200).json({ updatedUser, token });
  } catch (e) {
    return res.status(500).send("Internal server error");
  } finally {
    if (client) {
      await client.close();
    }
  }
});

module.exports = router;
