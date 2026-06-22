// src/utils/sendEmail.js
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Draw = require("../models/Draw");

const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
    },
});

// Welcome Email
async function sendWelcomeEmail(name, email) {
    try {
        await transporter.sendMail({
            from: `"Rollavo" <onboarding@resend.dev>`,
            to: email,
            subject: "Welcome to Rollavo 🎉",
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="background: linear-gradient(135deg, #e85d24, #d94d1a); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏌️ Welcome to Rollavo!</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #ffffff; margin-top: 0;">Hi ${name}!</h2>
                        <p style="color: rgba(255,255,255,0.7); line-height: 1.8;">
                            Thanks for joining Rollavo — the golf score monthly draw platform.
                        </p>
                        <p style="color: rgba(255,255,255,0.7); line-height: 1.8;">
                            You're now registered as a subscriber. Start playing and submit your scores to enter the monthly draw.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard" 
                               style="background: #e85d24; color: #ffffff; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
                                Go to Dashboard →
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0 20px;" />
                        <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">
                            Rollavo · Good luck on the course 🏌️
                        </p>
                    </div>
                </div>
            `,
        });
        console.log(`✅ Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send welcome email:", error);
        return false;
    }
}

// Reset Password Email
async function sendResetPasswordEmail(name, email, resetUrl) {
    try {
        console.log(name, email, resetUrl, "Password reset requested");

        await transporter.sendMail({
            from: `"Rollavo" <onboarding@resend.dev>`,
            to: email,
            subject: "Reset Your Rollavo Password 🔐",
            html: `
                <div style="
                    max-width: 600px;
                    margin: 0 auto;
                    background: #0a0a0a;
                    color: #ffffff;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #e85d24, #d94d1a);
                        padding: 45px 30px;
                        text-align: center;
                    ">
                        <h1 style="
                            color: #ffffff;
                            margin: 0;
                            font-size: 32px;
                            font-weight: 700;
                            letter-spacing: -0.5px;
                        ">
                            Password Reset
                        </h1>
                        <p style="
                            color: rgba(255,255,255,0.9);
                            margin-top: 12px;
                            font-size: 15px;
                            font-weight: 300;
                        ">
                            Secure access to your Rollavo account
                        </p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 40px 35px;">
                        <p style="
                            color: #ffffff;
                            font-size: 17px;
                            font-weight: 600;
                            margin-bottom: 20px;
                        ">
                            Hi ${name},
                        </p>

                        <p style="
                            color: rgba(255,255,255,0.7);
                            line-height: 1.8;
                            margin-bottom: 25px;
                            font-size: 15px;
                        ">
                            We received a request to reset the password for your Rollavo account.
                            If this was you, click the button below to create a new password.
                        </p>

                        <!-- Button -->
                        <div style="text-align: center; margin: 40px 0;">
                            <a
                                href="${resetUrl}"
                                style="
                                    background: linear-gradient(135deg, #e85d24, #d94d1a);
                                    color: #ffffff;
                                    text-decoration: none;
                                    padding: 16px 40px;
                                    border-radius: 999px;
                                    font-weight: 600;
                                    font-size: 15px;
                                    display: inline-block;
                                    box-shadow: 0 4px 14px rgba(232, 93, 36, 0.35);
                                "
                            >
                                Reset My Password →
                            </a>
                        </div>

                        <!-- Warning Box -->
                        <div style="
                            background: rgba(232, 93, 36, 0.1);
                            border-left: 4px solid #e85d24;
                            padding: 16px 20px;
                            border-radius: 8px;
                            margin-bottom: 25px;
                        ">
                            <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">
                                ⏱️ This reset link will expire in 
                                <strong style="color: #e85d24;">15 minutes</strong> 
                                for your security.
                            </p>
                        </div>

                        <p style="
                            color: rgba(255,255,255,0.5);
                            line-height: 1.7;
                            font-size: 14px;
                            margin-bottom: 10px;
                        ">
                            If you did not request a password reset, no action is required.
                            Your account remains secure and your password will not change.
                        </p>

                        <hr style="
                            border: none;
                            border-top: 1px solid rgba(255,255,255,0.1);
                            margin: 30px 0 20px;
                        " />

                        <!-- Footer -->
                        <div style="text-align: center;">
                            <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin: 0 0 5px;">
                                Rollavo • Golf. Charity. Monthly Rewards.
                            </p>
                            <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 5px 0 0;">
                                This is an automated message, please do not reply.
                            </p>
                        </div>
                    </div>
                </div>
            `,
        });
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send password reset email:", error);
        return false;
    }
}

// Email templates
function getWinnerEmailTemplate(winner) {
    const tierEmojis = {
        "5-match": "🎯",
        "4-match": "🏆",
        "3-match": "🥉",
    };

    const tierLabels = {
        "5-match": "JACKPOT WINNER!",
        "4-match": "Second Tier Winner",
        "3-match": "Third Tier Winner",
    };

    return `
        <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; font-family: Arial, sans-serif; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #fb923c, #f97316); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                    🎉 Congratulations!
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 12px; font-size: 16px;">
                    You're a winner in the Birdie•Give draw!
                </p>
            </div>

            <!-- Body -->
            <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 60px; margin-bottom: 10px;">
                        ${tierEmojis[winner.tier] || "🎉"}
                    </div>
                    <h2 style="color: #fb923c; font-size: 24px; margin: 0;">
                        ${tierLabels[winner.tier] || "Winner!"}
                    </h2>
                </div>

                <div style="background: rgba(251, 146, 60, 0.1); border: 1px solid rgba(251, 146, 60, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">
                        Prize Amount
                    </p>
                    <p style="color: #fb923c; font-size: 36px; font-weight: bold; margin: 0;">
                        £${winner.prizeAmount.toLocaleString()}
                    </p>
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 10px 0 0 0;">
                        Tier: ${winner.tier.replace("-", " ").toUpperCase()}
                    </p>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 10px;">
                        Next Steps
                    </h3>
                    <ol style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.8; padding-left: 20px;">
                        <li>Log in to your Birdie•Give dashboard</li>
                        <li>Upload a screenshot of your scores as proof</li>
                        <li>Wait for admin verification (24-48 hours)</li>
                        <li>Receive your prize via your preferred payment method</li>
                    </ol>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0;">
                        ⚠️ Important: You have <strong style="color: #ffffff;">7 days</strong> to claim your prize.
                        Please complete the verification process before the deadline.
                    </p>
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL}/dashboard/winners/${winner._id}"
                       style="background: #fb923c; color: #000000; text-decoration: none; padding: 14px 40px; border-radius: 999px; font-weight: 600; display: inline-block; font-size: 14px;">
                        Claim Your Prize →
                    </a>
                </div>

                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0 20px;" />

                <div style="text-align: center;">
                    <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">
                        Birdie•Give • Golf. Charity. Monthly Rewards.
                    </p>
                    <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 5px 0 0;">
                        This is an automated message, please do not reply.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Send winner notification email
async function sendWinnerNotification(winner) {
    try {
        const user = await User.findById(winner.userId).select("name email");
        if (!user) {
            console.error("❌ User not found for winner notification");
            return false;
        }

        const draw = await Draw.findById(winner.drawId);

        const mailOptions = {
            from: `"Rollavo" <onboarding@resend.dev>`,
            to: user.email,
            subject: `🎉 You've Won £${winner.prizeAmount} in the Birdie•Give Draw!`,
            html: getWinnerEmailTemplate({
                ...winner.toObject ? winner.toObject() : winner,
                name: user.name,
                drawMonth: draw?.month,
                drawYear: draw?.year,
            }),
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Winner notification sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send winner notification:", error);
        return false;
    }
}

// Send verification reminder email
async function sendVerificationReminder(winner) {
    try {
        const user = await User.findById(winner.userId).select("name email");
        if (!user) {
            console.error("❌ User not found for verification reminder");
            return false;
        }

        const daysRemaining = 7 - Math.floor((Date.now() - new Date(winner.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        const mailOptions = {
            from: `"Rollavo" <onboarding@resend.dev>`,
            to: user.email,
            subject: `⏰ Reminder: Verify Your Prize in ${daysRemaining} Days`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; font-family: Arial, sans-serif; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="background: linear-gradient(135deg, #fb923c, #f97316); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                            ⏰ Don't Forget to Verify!
                        </h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #ffffff; font-size: 16px;">
                            Hi ${user.name},
                        </p>
                        <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.8;">
                            You have <strong style="color: #fb923c;">${daysRemaining} days</strong> left to verify your
                            winnings of <strong style="color: #fb923c;">£${winner.prizeAmount}</strong>.
                            Please upload your proof screenshot to claim your prize.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/dashboard/winners/${winner._id}"
                               style="background: #fb923c; color: #000000; text-decoration: none; padding: 12px 30px; border-radius: 999px; font-weight: 600; display: inline-block;">
                                Verify Now
                            </a>
                        </div>
                        <p style="color: rgba(255,255,255,0.4); font-size: 12px;">
                            If you don't verify within 7 days, your prize will be forfeited.
                        </p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification reminder sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send verification reminder:", error);
        return false;
    }
}

// Send payment confirmation email
async function sendPaymentConfirmation(winner) {
    try {
        const user = await User.findById(winner.userId).select("name email");
        if (!user) {
            console.error("❌ User not found for payment confirmation");
            return false;
        }

        const mailOptions = {
            from: `"Rollavo" <onboarding@resend.dev>`,
            to: user.email,
            subject: `💰 Your Prize of £${winner.prizeAmount} Has Been Paid!`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; font-family: Arial, sans-serif; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                            💰 Payment Confirmed!
                        </h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #ffffff; font-size: 16px;">
                            Hi ${user.name},
                        </p>
                        <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.8;">
                            We're happy to confirm that your prize of
                            <strong style="color: #10b981; font-size: 20px;">£${winner.prizeAmount}</strong>
                            has been successfully paid to your account.
                        </p>
                        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
                            <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0;">
                                Transaction ID: <strong style="color: #ffffff;">${winner.payment?.transactionId || "N/A"}</strong>
                            </p>
                            <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 5px 0 0;">
                                Payment Date: <strong style="color: #ffffff;">${new Date(winner.payment?.completedAt).toLocaleDateString()}</strong>
                            </p>
                        </div>
                        <p style="color: rgba(255,255,255,0.4); font-size: 12px;">
                            Thank you for being part of the Birdie•Give community!
                        </p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Payment confirmation sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send payment confirmation:", error);
        return false;
    }
}

module.exports = {
    sendWelcomeEmail,
    sendResetPasswordEmail,
    sendWinnerNotification,
    sendVerificationReminder,
    sendPaymentConfirmation,
};