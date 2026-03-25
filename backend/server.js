const express = require("express");
const app = express();

app.get("/api", (req, res) => {
  res.json({ message: "Hello from Backend 🚀" });
});

<<<<<<< HEAD
app.listen(3000, () => {
=======
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, "0.0.0.0", () => {
>>>>>>> 0a863f9 (no localhost)
  console.log("Backend running on port 3000");
});
