const express = require("express");
const router = express.Router();
const { signup, login, getMe, forgotPassword, resetPassword, getAllUsers } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");


console.log("Auth routes loaded"); // add this line
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.get("/getallusers", getAllUsers)


// Google OAuth
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", session: false }),
    (req, res) => {
        const user = req.user;

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    }
);
module.exports = router;