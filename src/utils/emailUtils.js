const nodemailer = require("nodemailer");

// Create reusable transporter object
const createTransporter = () => {
  // For development, use services like Gmail
  // TODO: FOR prod, use services like SendGrid, Mailgun, or AWS SES

  if (process.env.NODE_ENV === "production") {
    // Production configuration (example with SendGrid)
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Development configuration (example with Gmail)
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  }
};

// Send email verification
const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();

  // Create verification URL
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  // Email template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - EcoRewards</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 10px;
                border: 1px solid #ddd;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #16a34a;
                margin-bottom: 10px;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .button {
                display: inline-block;
                background-color: #16a34a;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #15803d;
            }
            .footer {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 20px;
            }
            .warning {
                background-color: #fef3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🌱 EcoRewards</div>
                <h1>Welcome to EcoRewards!</h1>
            </div>
            
            <div class="content">
                <h2>Hi ${user.name}!</h2>
                <p>Thank you for joining EcoRewards! You're one step away from starting your eco-friendly journey.</p>
                
                <p>To complete your registration and start earning eco points, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verify My Email</a>
                </div>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                    ${verificationUrl}
                </p>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification email.
                </div>
                
                <p>Once verified, you'll be able to:</p>
                <ul>
                    <li>🏆 Earn eco points for sustainable actions</li>
                    <li>🎁 Claim rewards from our partners</li>
                    <li>📊 Track your environmental impact</li>
                    <li>🤝 Join eco challenges with the community</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>If you didn't create this account, please ignore this email.</p>
                <p>Need help? Contact us at support@ecorewards.com</p>
                <p>&copy; 2025 EcoRewards. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  // Text version for email clients that don't support HTML
  const textVersion = `
    Welcome to EcoRewards!
    
    Hi ${user.name},
    
    Thank you for joining EcoRewards! To complete your registration, please verify your email address by visiting this link:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create this account, please ignore this email.
    
    Best regards,
    The EcoRewards Team
  `;

  const mailOptions = {
    from: `EcoRewards <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Verify Your Email - Welcome to EcoRewards! 🌱",
    text: textVersion,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Email could not be sent");
  }
};

// Send password reset email (you might need this later)
const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your Password - EcoRewards</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
            .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌱 EcoRewards - Password Reset</h1>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>This link expires in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `EcoRewards <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Password Reset Request - EcoRewards",
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
