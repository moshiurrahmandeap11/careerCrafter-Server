// routes/connectRoutes.js
const express = require("express");
const connectDB = require("../db/mongodb");
const { dbName } = require("../config/config");

const router = express.Router();

// --- 1. Send a connection request ---
router.post("/", async (req, res) => {
  const { requesterEmail, targetEmail } = req.body;

  if (!requesterEmail || !targetEmail)
    return res.status(400).json({ error: "Both emails required." });

  if (requesterEmail === targetEmail)
    return res.status(400).json({ error: "You cannot connect with yourself." });

  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const connectionsCollection = db.collection("connections");

    const existingConnection = await connectionsCollection.findOne({
      $or: [
        { requesterEmail, recipientEmail: targetEmail },
        { requesterEmail: targetEmail, recipientEmail: requesterEmail },
      ],
    });

    if (existingConnection)
      return res.status(400).json({ error: "Connection already exists." });

    await connectionsCollection.insertOne({
      requesterEmail,
      recipientEmail: targetEmail,
      status: "pending",
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Connection request sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- 2. Get pending invitations for a user ---
router.get("/invitations", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "User email is required." });

  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const connectionsCollection = db.collection("connections");
    const usersCollection = db.collection("users");

    const invitations = await connectionsCollection
      .aggregate([
        { $match: { recipientEmail: email, status: "pending" } },
        {
          $lookup: {
            from: "users",
            localField: "requesterEmail",
            foreignField: "email",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            id: "$_id",
            user: {
              email: "$user.email",
              name: "$user.name",
              jobTitle: "$user.jobTitle",
            },
          },
        },
      ])
      .toArray();

    res.status(200).json({ invitations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- 3. Respond to an invitation (accept/ignore) ---
router.post("/invitation/:invitationId", async (req, res) => {
  const { invitationId } = req.params;
  const { recipientEmail, accept } = req.body;

  if (!recipientEmail)
    return res.status(400).json({ error: "Recipient email required." });

  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const connectionsCollection = db.collection("connections");

    const newStatus = accept ? "accepted" : "ignored";

    const result = await connectionsCollection.updateOne(
      { _id: new require("mongodb").ObjectId(invitationId), recipientEmail },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0)
      return res
        .status(404)
        .json({ error: "Invitation not found or invalid recipient." });

    res.status(200).json({ message: `Invitation ${newStatus}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- 4. Get suggested users ---
router.get("/suggested", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "User email is required." });

  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const connectionsCollection = db.collection("connections");
    const usersCollection = db.collection("users");

    const existingConnections = await connectionsCollection
      .find({
        $or: [{ requesterEmail: email }, { recipientEmail: email }],
      })
      .toArray();

    const connectedEmails = existingConnections.map((conn) =>
      conn.requesterEmail === email ? conn.recipientEmail : conn.requesterEmail
    );

    const allEmailsToExclude = [email, ...connectedEmails];

    const suggestedUsers = await usersCollection
      .find({
        email: { $nin: allEmailsToExclude },
      })
      .toArray();

    const formattedUsers = suggestedUsers.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      profilePicture:
        u.profilePicture ||
        "https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D",
      tags: u.tags || [
        "MERN Stack Developer",
        "Full Stack Developer",
        "Frontend Developer",
        "Backend Developer",
      ],
    }));
    res.status(200).json({ users: formattedUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- 5. Get accepted connections ---
router.get("/my-connections", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "User email is required." });

  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const connectionsCollection = db.collection("connections");
    const usersCollection = db.collection("users");

    const connections = await connectionsCollection
      .aggregate([
        {
          $match: {
            status: "accepted",
            $or: [{ requesterEmail: email }, { recipientEmail: email }],
          },
        },
        {
          $addFields: {
            friendEmail: {
              $cond: {
                if: { $eq: ["$requesterEmail", email] },
                then: "$recipientEmail",
                else: "$requesterEmail",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "friendEmail",
            foreignField: "email",
            as: "friend",
          },
        },
        { $unwind: "$friend" },
        {
          $project: {
            email: "$friend.email",
            name: "$friend.name",
            jobTitle: "$friend.jobTitle",
          },
        },
      ])
      .toArray();

    res.status(200).json({ connections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
