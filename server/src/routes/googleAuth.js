const express = require("express");
const passport = require("passport");
const jwt = require('jsonwebtoken');

const router = express.Router()

// Redirect to Google's consent screen
router.get(
    "router",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

// Step 2: Google redirects back here with the authorization code
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed`
    }),
    (req, res) => {
        // Passport attaches the user to req.user after successful authentication
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Redirect to the frontend with the token
        // The frontend will extract the token from the URL and store it
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    }
);

module.exports = router;