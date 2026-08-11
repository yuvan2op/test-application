const express = require("express");
const app = express();

let clickCount = 0;

app.get("/api", (req, res) => {
  clickCount += 1;
  res.json({
    message: "Hello from Backend 🚀",
    clickCount,
    status: "connected"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/api/clicks", (req, res) => {
  res.json({ clickCount });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Backend running on port 3000");
});
