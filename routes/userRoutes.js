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

module.exports = router;
