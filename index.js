require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/mongodb');
const userRoutes = require('./routes/userRoutes');
const { port } = require('./config/config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Prefix all routes with /v1
app.use('/v1', userRoutes);

app.get('/', (req, res) => res.send('Hello Syntax Six Warriors'));



// Start server
connectDB().then(() => {
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
