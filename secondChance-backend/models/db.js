require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const path = require("path");

const url = process.env.MONGO_URL;
const dbName = "secondChance";
const collectionName = "secondChanceItems";

let filename = path.join(
  __dirname,
  "../util/import-mongo/",
  "secondChanceItems.json"
);
const data = JSON.parse(fs.readFileSync(filename, "utf-8")).docs;

async function connectToDatabase() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected successfully to server");

    // database will be created if it does not exist
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    let cursor = await collection.find({});
    let documents = await cursor.toArray();

    if (documents.length === 0) {
      const insertResult = await collection.insertMany(data);
      console.log("Inserted documents:", insertResult.insertedCount);
    } else {
      console.log("Items already exists in DB");
    }
    return { db, client };
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
}

module.exports = { connectToDatabase };
