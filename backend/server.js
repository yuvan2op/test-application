const express = require("express");
const app = express();

app.get("/api", (req, res) => {
  res.json({ message: "Hello from Backend 🚀" });
});

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Backend running on port 3000");
});
