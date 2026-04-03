import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, name, code) => {
  const mailOptions = {
    from: `"FitTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🏃 Verify your FitTrack account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F4621F; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏃 FitTrack</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Conquer your city, one step at a time</p>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #E5E7EB;">
          <h2 style="color: #141416;">Hi ${name}! 👋</h2>
          <p style="color: #6B7280; font-size: 16px;">Welcome to FitTrack! Use this code to verify your email:</p>
          <div style="background: #FFF1EB; border: 2px solid #F4621F; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <h1 style="color: #F4621F; font-size: 48px; letter-spacing: 12px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #6B7280;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #6B7280;">If you didn't create a FitTrack account, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            © 2026 FitTrack. Made with ❤️ for walkers everywhere.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"FitTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to FitTrack!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F4621F; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏃 FitTrack</h1>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #E5E7EB;">
          <h2 style="color: #141416;">Welcome aboard, ${name}! 🎉</h2>
          <p style="color: #6B7280; font-size: 16px;">Your account is verified. Start walking and conquer your city!</p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="background: #FFF1EB; border-radius: 12px; padding: 20px; display: inline-block;">
              <p style="color: #F4621F; font-weight: bold; margin: 0;">🪙 100 Bonus Coins added to your account!</p>
            </div>
          </div>
          <p style="color: #6B7280;">Happy walking! 🚶</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};