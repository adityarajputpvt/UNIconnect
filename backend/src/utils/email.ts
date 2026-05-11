import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email send failed:', error);
    throw new Error('Failed to send email');
  }
};

export const emailTemplates = {
  verifyEmail: (name: string, token: string) => ({
    subject: 'Verify your Uni-Connect account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Uni-Connect</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Your University Ecosystem</p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a2e;">Hello, ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">Welcome to Uni-Connect. Please verify your email address to get started.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${config.frontendUrl}/verify-email?token=${token}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  resetPassword: (name: string, token: string) => ({
    subject: 'Reset your Uni-Connect password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Uni-Connect</h1>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1a1a2e;">Password Reset Request</h2>
          <p style="color: #666;">Hi ${name}, we received a request to reset your password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${config.frontendUrl}/reset-password?token=${token}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  achievementVerified: (name: string, achievementTitle: string, status: string, remarks?: string) => ({
    subject: `Achievement ${status === 'APPROVED' ? 'Approved' : 'Update'} - Uni-Connect`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Uni-Connect</h1>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1a1a2e;">Achievement Update</h2>
          <p style="color: #666;">Hi ${name}, your achievement "<strong>${achievementTitle}</strong>" has been ${status.toLowerCase().replace('_', ' ')}.</p>
          ${remarks ? `<div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="color: #666; margin: 0;"><strong>Reviewer remarks:</strong> ${remarks}</p></div>` : ''}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${config.frontendUrl}/dashboard/achievements" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Achievement
            </a>
          </div>
        </div>
      </div>
    `,
  }),
};
