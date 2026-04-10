const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/testdb";
const dbName = process.env.DB_NAME || "testdb";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // In production, use environment variable

let db;

// Connect to MongoDB
async function connectToMongo() {
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = new MongoClient(mongoUrl);
      await client.connect();
      db = client.db(dbName);
      console.log("Connected to MongoDB");
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s before retry
      } else {
        console.error("Max MongoDB connection retries exhausted");
        throw error;
      }
    }
  }
}


// Middleware
app.use(cors());
app.use(express.json());

// Middleware to ensure DB is connected before API calls
const ensureDbConnected = async (req, res, next) => {
  if (!db) {
    try {
      await connectToMongo();
    } catch (error) {
      return res.status(503).json({ error: "Database temporarily unavailable, retrying..." });
    }
  }
  next();
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Backend 🚀" });
});

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

// User registration
app.post("/api/auth/register", ensureDbConnected, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await db.collection("users").insertOne(user);
    res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
app.post("/api/auth/login", ensureDbConnected, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user
    const user = await db.collection("users").findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: "Login successful", token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected route - get current user
app.get("/api/auth/me", authenticateToken, ensureDbConnected, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected route - simulate user action (for load testing)
app.post("/api/user/action", authenticateToken, ensureDbConnected, async (req, res) => {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    // Log the action (could be stored in DB for analytics)
    const action = {
      userId: req.user.userId,
      action: req.body.action || "default_action",
      timestamp: new Date(),
      data: req.body.data || {}
    };

    await db.collection("user_actions").insertOne(action);

    res.json({ message: "Action performed successfully", actionId: action._id });
  } catch (error) {
    console.error("Error performing action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get users with optional limit
app.get("/api/users", ensureDbConnected, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await db.collection("users").find({}).limit(limit).toArray();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get count of users
app.get("/api/users/count", ensureDbConnected, async (req, res) => {
  try {
    const count = await db.collection("users").countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
async function startServer() {
  // Start HTTP server first (for health checks)
  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend running on port ${port}`);
  });
  
  // Try to connect to MongoDB in background
  connectToMongo().catch(error => {
    console.error("MongoDB connection failed on startup, will retry on-demand:", error.message);
  });
}

startServer();
