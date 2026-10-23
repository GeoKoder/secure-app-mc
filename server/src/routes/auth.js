const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const authenticate = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Helper: generate JWT token
function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );
}

// Helper: Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // --- Input Validation ---
        if (!email || !password || !name) {
            return res.status(400).json({
                error: "All fields are required",
                details: {
                    email: !email ? "Email is required" : undefined,
                    password: !password ? "Password is required" : undefined,
                    name: !name ? "Name is required" : undefined,
                },
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email format "});
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long",
            });
        }

        if (name.trim().length  <2) {
            return res.status(400).json({
                error: "Name must be at least 2 characters long"
            });
        }

        // --- Check for Existing USer ---
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // --- Hash  Password ---
        const passwordHash = await bcrypt.hash(password, 10);

        // --- Create User ---
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                name: name.trim(),
            },
        });

        // --- Generate Token ---
        const token = generateToken(user);

        // --- Return Response --- 
        res.status(201).json({
            message: "Registation successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Input Validation ---
        if (!email || !password) {
            return res.status(400).json({error: "Email and password are required" })
        }

        // -- Find User ---
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Same error messahe whether user exists or o=not (prevent enumeration)
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // --- Verify Password ---
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // --- Generate Token ---
        const token = generateToken(user);

        // --- Return Response ---
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Login error", error);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});

// GET /api/auth/me -- Returns the current authenticated user
router.get("/me", authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to get user profile" });
    }
});

module.exports = router;