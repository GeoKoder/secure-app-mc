const express = require("express");
const cors = require("cors");
const passport = require("./config/passport")
require("dotenv").config();

const authRoutes = require("./routes/auth")
const googleAuthRoutes = require("./routes/googleAuth");

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", //Vite's default port
    credentials: true,
}));
app.use(express.json());
app.use(passport.initialize())

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes)

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})