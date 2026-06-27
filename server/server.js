const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const apiRoutes = require("./routes/routes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ezbiz";

// Enable CORS for frontend client port
app.use(cors({
  origin: "http://localhost:5173", // default Vite dev server
  credentials: true
}));

// Body parsing middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Register routes
app.use("/api", apiRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("EzBiz Operations Ledger REST API is running...");
});

// Database connection & listener
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}...`);
    });
  })
  .catch((err) => {
    console.error("MongoDB database connection failure:", err.message);
  });
