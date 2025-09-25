const { MongoClient, ServerApiVersion } = require('mongodb');
const { mongoURI } = require('../config/config');


const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
    return client;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
module.exports = connectDB;

