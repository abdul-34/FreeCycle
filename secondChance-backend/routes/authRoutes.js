require("dotenv").config();
const express = require("express");
const router = express.Router();
const { connectToDatabase } = require("../models/db");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    const userExists = await collection.findOne({ email: email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }
    // Create a hash to encrypt the password so that it is not readable in the database
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    // Insert the user into the database
    const user = await collection.insertOne({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      created_at: new Date(),
    });
    // Create JWT authentication if passwords match with user._id as payload

    const token = jwt.sign({ id: user.insertedId }, process.env.JWT_SECRET);
    // Return the user email and the token as a JSON
    res.status(200).json({ email, token });
  } catch (e) {
    return res.status(500).send("Internal server error");
  } finally {
    if (client) {
      await client.close();
    }
  }
});

module.exports = router;
