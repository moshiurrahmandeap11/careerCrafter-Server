const express = require("express");
const connectDB = require("../db/mongodb");
const { dbName } = require("../config/config");
const { ObjectId } = require("mongodb");

const router = express.Router();

// --- USERS ROUTES ---
// GET all users
router.get("/users", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users except me
router.get("/allUsers", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    const currentUserEmail = req.query.email;

    const users = await usersCollection
      .find({ email: { $ne: currentUserEmail } })
      .toArray();

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE a new user
router.post("/users", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    const result = await usersCollection.insertOne(req.body);
    res.status(201).json({ message: "User created", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE user by email
router.put("/users/:email", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const userEmail = req.params.email;

    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH user by ID
router.patch("/users/:id", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const userId = req.params.id;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE user
router.delete("/users/:id", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const userId = req.params.id;

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET user by email
router.get("/users/email/:email", async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const email = req.params.email;

    const user = await usersCollection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- CHAT ROUTES ---
// Save a message
router.post("/messages", async (req, res) => {
  try {
    const { fromEmail, toEmail, message } = req.body;

    if (!fromEmail || !toEmail || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const client = await connectDB();
    const db = client.db(dbName);
    const messagesCollection = db.collection("messages");

    const chat = {
      fromEmail,
      toEmail,
      message,
      timestamp: new Date(),
    };

    const result = await messagesCollection.insertOne(chat);
    res.status(201).json({ message: "Message saved", data: result });
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get chat history between two users
router.get("/messages", async (req, res) => {
  try {
    const { userEmail, friendEmail } = req.query;

    if (!userEmail || !friendEmail) {
      return res
        .status(400)
        .json({ error: "Both userEmail and friendEmail are required" });
    }

    const client = await connectDB();
    const db = client.db(dbName);
    const messagesCollection = db.collection("messages");

    const chats = await messagesCollection
      .find({
        $or: [
          { fromEmail: userEmail, toEmail: friendEmail },
          { fromEmail: friendEmail, toEmail: userEmail },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(chats);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
