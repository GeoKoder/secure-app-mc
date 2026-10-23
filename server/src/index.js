const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth")

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173", //Vite's default port
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})