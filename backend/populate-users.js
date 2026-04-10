const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const mongoUrl = "mongodb://localhost:27017/testdb";
const dbName = "testdb";

async function populateUsers() {
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Clear existing users
    await db.collection("users").deleteMany({});

    // Create test users
    const users = [];
    for (let i = 1; i <= 1000; i++) {
      const hashedPassword = await bcrypt.hash(`password${i}`, 10);
      users.push({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        createdAt: new Date()
      });
    }

    await db.collection("users").insertMany(users);
    console.log("Populated database with 1000 test users");
  } catch (error) {
    console.error("Error populating users:", error);
  } finally {
    await client.close();
  }
}

populateUsers();