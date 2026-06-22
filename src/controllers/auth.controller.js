const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendWelcomeEmail, sendResetPasswordEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const ADMIN_EMAILS = ["admin1rollavo@gmail.com"];

function signToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// POST /api/auth/signup
async function signup(req, res) {
    console.log("Signup request received:", req.body); // add this line
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: "Email already in use" });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const role = ADMIN_EMAILS.includes(email) ? "admin" : "subscriber";

        const user = await User.create({
            name,
            email,
            passwordHash,
            authProvider: "credentials",
            role,
        });

        const token = signToken(user);

        sendWelcomeEmail(name, email).catch((err) =>
            console.error("Welcome email failed:", err)
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Server error" });
    }
}

// POST /api/auth/login
async function login(req, res) {
    console.log("Login request received:", req.body); // add this line
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Promote to admin if email matches
        if (ADMIN_EMAILS.includes(email) && user.role !== "admin") {
            await User.updateOne({ email }, { role: "admin" });
            user.role = "admin";
        }

        const token = signToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
}

// GET /api/auth/me
async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscription: user.subscription,
            },
        });
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({ error: "Server error" });
    }
}


async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: "Email is required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                message:
                    "If an account exists with that email, a reset link has been sent.",
            });
        }

        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;

        user.resetPasswordExpires =
            Date.now() + 15 * 60 * 1000; // 15 mins

        await user.save();

        const resetUrl =
            `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // Send Email Here

        await sendResetPasswordEmail(
            user.name,
            user.email,
            resetUrl
        );

        res.json({
            message:
                "Password reset link sent successfully",
        });
    } catch (err) {
        console.error("Forgot Password Error:", err);

        res.status(500).json({
            error: "Server error",
        });
    }
}



async function getAllUsers(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const users = await User.find()
            .select("-passwordHash")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments();

        res.json({
            users,
            page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
        });
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
    }
}



async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                error: "Token and password required",
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {
                $gt: Date.now(),
            },
        }).select("+passwordHash");

        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired token",
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 12);

        user.passwordHash = passwordHash;

        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.json({
            message:
                "Password reset successful",
        });
    } catch (err) {
        console.error("Reset Password Error:", err);

        res.status(500).json({
            error: "Server error",
        });
    }
}
module.exports = { signup, login, getMe, forgotPassword, resetPassword, getAllUsers };