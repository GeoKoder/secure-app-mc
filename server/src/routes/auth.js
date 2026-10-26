const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const authenticate = require("../middleware/auth");
const { registerSchema } = require("../validators/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Helper: generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
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
    const validatedData = registerSchema.parse(req.body);

    const { email, password, name } = validatedData;

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
      return res.status(400).json({ error: "Invalid email format " });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters long",
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
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Input Validation ---
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
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

router.put("/password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // 1. Validate the request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Your new password must be different",
      });
    }

    // 2. Find the authenticated user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    // 3. Verify the current password against its hash
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // 4. Validate the new password
    const isStrongEnough =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);

    if (!isStrongEnough) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters and include an uppercase letter, a number, and a special character",
      });
    }

    // 5. Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Unable to change password",
    });
  }
});

router.delete("/account", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Confirm the account exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    // Delete only the authenticated user's account
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    // Related records may prevent deletion
    if (error.code === "P2003" || error.code === "P2014") {
      return res.status(409).json({
        message:
          "This account has related records that must be handled before deletion",
      });
    }

    return res.status(500).json({
      message: "Unable to delete account",
    });
  }
});

module.exports = router;
