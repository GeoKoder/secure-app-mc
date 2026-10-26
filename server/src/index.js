const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");
const {
  generalLimiter,
  authLimiter,
  registerLimiter,
} = require("./middleware/rateLimiter");
const helmet = require("helmet");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const noteRoutes = require("./routes/notes");
const adminRoutes = require("./routes/admin");
const googleAuthRoutes = require("./routes/googleAuth");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", //Vite's default port
    credentials: true,
  }),
);
app.use(express.json());
app.use(passport.initialize());
app.use(generalLimiter);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Strict Rate Limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", registerLimiter); 

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", googleAuthRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
