import nodemailer from 'nodemailer';
import config from './env.js';

const canSendEmail = Boolean(config.emailUser && config.emailPass);

const transporter = canSendEmail
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    })
  : null;

const sendEmail = async (options = {}) => {
  if (!canSendEmail || !transporter) {
    return false;
  }
  await transporter.sendMail({
    from: `"FitTrack" <${config.emailUser}>`,
    ...options,
  });
  return true;
};

export const sendWelcomeEmail = async (email, name) => {
  const html = [
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">',
    '<div style="background: #F4621F; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">',
    '<h1 style="color: #fff; margin: 0;">Welcome to FitTrack</h1>',
    '</div>',
    '<div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">',
    `<p style="color: #111827; font-size: 16px;">Hi ${name || 'there'},</p>`,
    '<p style="color: #374151; font-size: 15px;">Your account is ready. Start walking, earn coins, and climb the leaderboard.</p>',
    '<p style="color: #374151; font-size: 15px;">You also start with 100 bonus coins.</p>',
    '<p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">FitTrack</p>',
    '</div></div>',
  ].join('');

  return sendEmail({
    to: email,
    subject: 'Welcome to FitTrack',
    html,
  });
};

export const sendVerificationEmail = async (email, name, code) => {
  const html = [
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">',
    '<div style="background: #111827; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">',
    '<h1 style="color: #fff; margin: 0;">Verify your email</h1>',
    '</div>',
    '<div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">',
    `<p style="color: #111827; font-size: 16px;">Hi ${name || 'there'},</p>`,
    '<p style="color: #374151; font-size: 15px;">Use this code to verify your FitTrack account. It expires in 10 minutes.</p>',
    `<div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #F4621F; margin: 16px 0;">${code}</div>`,
    '<p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">FitTrack</p>',
    '</div></div>',
  ].join('');

  return sendEmail({
    to: email,
    subject: 'FitTrack verification code',
    html,
  });
};
