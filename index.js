import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db/mongodb.js";
import userRoutes from "./routes/userRoutes.js";
import config from "./config/config.js";
import { Server } from "socket.io";
import { createServer } from "http";

const { port, dbName } = config;

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track online users
const onlineUsers = new Map();

// --- MongoDB setup ---
let messagesCollection;

connectDB().then((client) => {
  const db = client.db(dbName);
  messagesCollection = db.collection("messages");

  server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
});

// --- SOCKET.IO logic ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (email) => {
    onlineUsers.set(email, socket.id);
    console.log(`${email} joined chat`);
  });

  socket.on("send-message", async ({ toEmail, message, fromEmail }) => {
    const chat = { fromEmail, toEmail, message, timestamp: new Date() };

    // Save message in DB
    await messagesCollection.insertOne(chat);

    // Deliver in real-time
    const recipientSocket = onlineUsers.get(toEmail);
    if (recipientSocket) {
      io.to(recipientSocket).emit("receive-message", chat);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const [email, id] of onlineUsers.entries()) {
      if (id === socket.id) onlineUsers.delete(email);
    }
  });
});

// Prefix all routes with /v1
app.use("/v1", userRoutes);

app.get("/", (req, res) => res.send("Hello Syntax Six Warriors"));



