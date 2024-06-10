require("dotenv").config();
const { MongoClient } = require('mongodb');

let db;

async function run() {
    if (db) return db;
    
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect()
        .then(() => console.log("Connected to database"))
        .catch(err => console.error("Failed to connect to database", err));

    db = client.db('Mongo-Chatroom');
    return db;
}

module.exports = { run };