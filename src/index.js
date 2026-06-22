const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const charityRoutes = require("./routes/charity.routes")
const passport = require("./config/passport");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/charity", charityRoutes);
console.log("Routes registered"); // add this line


app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});