const express = require('express');
const connectDB = require('../db/mongodb');
const { dbName } = require('../config/config');
const router = express.Router();

// GET all users
router.get('/users', async (req, res) => {
    try {
        const client = await connectDB();
        const db = client.db(dbName);
        const usersCollection = db.collection('users');

        const users = await usersCollection.find({}).toArray();
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/allUsers', async (req, res) => {
    try {
      const client = await connectDB();
      const db = client.db(dbName);
      const usersCollection = db.collection('users');
  
      // assuming you pass the current user's email in query: /users?email=me@example.com
      const currentUserEmail = req.query.email;
  
      const users = await usersCollection.find({
        email: { $ne: currentUserEmail }
      }).toArray();
  
      res.status(200).json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

// CREATE a new user
router.post('/users', async (req, res) => {
    try {
        const client = await connectDB();
        const db = client.db(dbName);
        const usersCollection = db.collection('users');

        const result = await usersCollection.insertOne(req.body);
        res.status(201).json({ message: 'User created', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE a user's sources (PUT)
router.put('/users/:email', async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const userEmail = req.params.email;

    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



// PARTIALLY UPDATE a user (PATCH)
router.patch('/users/:id', async (req, res) => {
    try {
        const client = await connectDB();
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
        const userId = req.params.id;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No update fields provided' });
        }

        const result = await usersCollection.updateOne(
            { _id: new require('mongodb').ObjectId(userId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User updated', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE a user
router.delete('/users/:id', async (req, res) => {
    try {
        const client = await connectDB();
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
        const userId = req.params.id;

        const result = await usersCollection.deleteOne({
            _id: new require('mongodb').ObjectId(userId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/users/email/:email', async (req, res) => {
    try {
        const client = await connectDB();
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
        const email = req.params.email;

        const user = await usersCollection.findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
