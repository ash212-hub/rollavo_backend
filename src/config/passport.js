const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/sendEmail")
const ADMIN_EMAILS = ["admin1rollavo@gmail.com"];

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const role = ADMIN_EMAILS.includes(email) ? "admin" : "subscriber";

                let user = await User.findOne({ email });

                if (user) {
                    // Update googleId if missing
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    name: profile.displayName,
                    email,
                    googleId: profile.id,
                    authProvider: "google",
                    role,
                });

                // Fire and forget — don't await, don't block auth
                sendWelcomeEmail(user.name, user.email).catch(err =>
                    console.error("Welcome email failed:", err)
                );
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;