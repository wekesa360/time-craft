// Email Service
// Handles all email sending functionality using Resend API

import { logger } from './logger';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResponse {
  id: string;
  success: boolean;
  error?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private baseUrl = 'https://api.resend.com';

  constructor(apiKey: string, fromEmail: string = 'noreply@timecraft.app') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          tags: options.tags || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`Resend API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json() as any;
      
      logger.info('Email sent successfully', {
        emailId: data.id,
        to: options.to,
        subject: options.subject
      });

      return {
        id: data.id,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
      
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: errorMessage
      });

      return {
        id: '',
        success: false,
        error: errorMessage
      };
    }
  }

  // Student Verification OTP Email
  async sendVerificationOTP(email: string, otpCode: string, language: string = 'en'): Promise<EmailResponse> {
    const templates = this.getVerificationOTPTemplates();
    const template = templates[language] || templates.en;

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html.replace('{{OTP_CODE}}', otpCode),
      text: template.text.replace('{{OTP_CODE}}', otpCode),
      tags: [
        { name: 'type', value: 'verification_otp' },
        { name: 'language', value: language }
      ]
    });
  }

  // Login OTP Email
  async sendLoginOTP(email: string, otpCode: string, language: string = 'en'): Promise<EmailResponse> {
    const templates = this.getLoginOTPTemplates();
    const template = templates[language] || templates.en;

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html.replace('{{OTP_CODE}}', otpCode),
      text: template.text.replace('{{OTP_CODE}}', otpCode),
      tags: [
        { name: 'type', value: 'login_otp' },
        { name: 'language', value: language }
      ]
    });
  }

  // Password Reset Email
  async sendPasswordReset(email: string, resetLink: string, language: string = 'en'): Promise<EmailResponse> {
    const templates = this.getPasswordResetTemplates();
    const template = templates[language] || templates.en;

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html.replace('{{RESET_LINK}}', resetLink),
      text: template.text.replace('{{RESET_LINK}}', resetLink),
      tags: [
        { name: 'type', value: 'password_reset' },
        { name: 'language', value: language }
      ]
    });
  }

  // Welcome Email
  async sendWelcomeEmail(email: string, firstName: string, language: string = 'en'): Promise<EmailResponse> {
    const templates = this.getWelcomeTemplates();
    const template = templates[language] || templates.en;

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html.replace('{{FIRST_NAME}}', firstName),
      text: template.text.replace('{{FIRST_NAME}}', firstName),
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'language', value: language }
      ]
    });
  }

  // Notification Email
  async sendNotification(email: string, title: string, message: string, language: string = 'en'): Promise<EmailResponse> {
    const templates = this.getNotificationTemplates();
    const template = templates[language] || templates.en;

    return this.sendEmail({
      to: email,
      subject: template.subject.replace('{{TITLE}}', title),
      html: template.html
        .replace('{{TITLE}}', title)
        .replace('{{MESSAGE}}', message),
      text: template.text
        .replace('{{TITLE}}', title)
        .replace('{{MESSAGE}}', message),
      tags: [
        { name: 'type', value: 'notification' },
        { name: 'language', value: language }
      ]
    });
  }

  // Email Templates
  private getVerificationOTPTemplates(): Record<string, EmailTemplate> {
    return {
      en: {
        subject: 'Verify your TimeCraft account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your account</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Personal Productivity & Wellness Companion</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Verify Your Account</h2>
              <p>Thank you for signing up for TimeCraft! To complete your registration, please use the verification code below:</p>
              
              <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 30px 0; border-radius: 8px; letter-spacing: 5px;">
                {{OTP_CODE}}
              </div>
              
              <p>This code will expire in 15 minutes for security reasons.</p>
              
              <p>If you didn't create an account with TimeCraft, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft - Verify Your Account

Thank you for signing up for TimeCraft! To complete your registration, please use the verification code below:

{{OTP_CODE}}

This code will expire in 15 minutes for security reasons.

If you didn't create an account with TimeCraft, please ignore this email.

© 2025 TimeCraft. All rights reserved.
        `
      },
      de: {
        subject: 'Bestätigen Sie Ihr TimeCraft-Konto',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Konto bestätigen</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Ihr persönlicher Produktivitäts- und Wellness-Begleiter</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Konto bestätigen</h2>
              <p>Vielen Dank für die Anmeldung bei TimeCraft! Um Ihre Registrierung abzuschließen, verwenden Sie bitte den folgenden Bestätigungscode:</p>
              
              <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 30px 0; border-radius: 8px; letter-spacing: 5px;">
                {{OTP_CODE}}
              </div>
              
              <p>Dieser Code läuft aus Sicherheitsgründen in 15 Minuten ab.</p>
              
              <p>Wenn Sie kein Konto bei TimeCraft erstellt haben, ignorieren Sie diese E-Mail bitte.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. Alle Rechte vorbehalten.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft - Konto bestätigen

Vielen Dank für die Anmeldung bei TimeCraft! Um Ihre Registrierung abzuschließen, verwenden Sie bitte den folgenden Bestätigungscode:

{{OTP_CODE}}

Dieser Code läuft aus Sicherheitsgründen in 15 Minuten ab.

Wenn Sie kein Konto bei TimeCraft erstellt haben, ignorieren Sie diese E-Mail bitte.

© 2025 TimeCraft. Alle Rechte vorbehalten.
        `
      }
    };
  }

  private getLoginOTPTemplates(): Record<string, EmailTemplate> {
    return {
      en: {
        subject: 'Your TimeCraft login code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login to TimeCraft</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Personal Productivity & Wellness Companion</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Login Code</h2>
              <p>You requested a login code for your TimeCraft account. Use the code below to sign in:</p>
              
              <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 30px 0; border-radius: 8px; letter-spacing: 5px;">
                {{OTP_CODE}}
              </div>
              
              <p>This code will expire in 10 minutes for security reasons.</p>
              
              <p>If you didn't request this login code, please ignore this email and consider changing your password.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft - Login Code

You requested a login code for your TimeCraft account. Use the code below to sign in:

{{OTP_CODE}}

This code will expire in 10 minutes for security reasons.

If you didn't request this login code, please ignore this email and consider changing your password.

© 2025 TimeCraft. All rights reserved.
        `
      },
      de: {
        subject: 'Ihr TimeCraft-Anmeldecode',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bei TimeCraft anmelden</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Ihr persönlicher Produktivitäts- und Wellness-Begleiter</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Anmeldecode</h2>
              <p>Sie haben einen Anmeldecode für Ihr TimeCraft-Konto angefordert. Verwenden Sie den folgenden Code, um sich anzumelden:</p>
              
              <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 30px 0; border-radius: 8px; letter-spacing: 5px;">
                {{OTP_CODE}}
              </div>
              
              <p>Dieser Code läuft aus Sicherheitsgründen in 10 Minuten ab.</p>
              
              <p>Wenn Sie diesen Anmeldecode nicht angefordert haben, ignorieren Sie diese E-Mail bitte und erwägen Sie, Ihr Passwort zu ändern.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. Alle Rechte vorbehalten.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft - Anmeldecode

Sie haben einen Anmeldecode für Ihr TimeCraft-Konto angefordert. Verwenden Sie den folgenden Code, um sich anzumelden:

{{OTP_CODE}}

Dieser Code läuft aus Sicherheitsgründen in 10 Minuten ab.

Wenn Sie diesen Anmeldecode nicht angefordert haben, ignorieren Sie diese E-Mail bitte und erwägen Sie, Ihr Passwort zu ändern.

© 2025 TimeCraft. Alle Rechte vorbehalten.
        `
      }
    };
  }

  private getPasswordResetTemplates(): Record<string, EmailTemplate> {
    return {
      en: {
        subject: 'Reset your TimeCraft password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Personal Productivity & Wellness Companion</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{RESET_LINK}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p>This link will expire in 1 hour for security reasons.</p>
              
              <p>If you didn't request a password reset, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft - Reset Your Password

We received a request to reset your password. Click the link below to create a new password:

{{RESET_LINK}}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email.

© 2025 TimeCraft. All rights reserved.
        `
      },
      de: {
        subject: 'TimeCraft-Passwort zurücksetzen',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Passwort zurücksetzen</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Ihr persönlicher Produktivitäts- und Wellness-Begleiter</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Passwort zurücksetzen</h2>
              <p>Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu erstellen:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{RESET_LINK}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Passwort zurücksetzen
                </a>
              </div>
              
              <p>Dieser Link läuft aus Sicherheitsgründen in 1 Stunde ab.</p>
              
              <p>Wenn Sie kein Passwort-Reset angefordert haben, ignorieren Sie diese E-Mail bitte.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. Alle Rechte vorbehalten.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft - Passwort zurücksetzen

Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie auf den Link unten, um ein neues Passwort zu erstellen:

{{RESET_LINK}}

Dieser Link läuft aus Sicherheitsgründen in 1 Stunde ab.

Wenn Sie kein Passwort-Reset angefordert haben, ignorieren Sie diese E-Mail bitte.

© 2025 TimeCraft. Alle Rechte vorbehalten.
        `
      }
    };
  }

  private getWelcomeTemplates(): Record<string, EmailTemplate> {
    return {
      en: {
        subject: 'Welcome to TimeCraft! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to TimeCraft</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TimeCraft!</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your journey to better productivity and wellness starts now</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hi {{FIRST_NAME}}! 👋</h2>
              <p>Welcome to TimeCraft, your all-in-one productivity and wellness companion! We're excited to help you achieve your goals and build better habits.</p>
              
              <h3 style="color: #667eea;">What you can do with TimeCraft:</h3>
              <ul style="color: #555;">
                <li>📋 Smart task management with AI prioritization</li>
                <li>⏰ Focus sessions and Pomodoro timers</li>
                <li>🏃‍♀️ Health and fitness tracking</li>
                <li>🧘‍♀️ Mindfulness and reflection journaling</li>
                <li>📊 Progress analytics and insights</li>
              </ul>
              
              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #667eea; margin-top: 0;">Get Started:</h4>
                <p style="margin-bottom: 0;">1. Complete your profile setup<br>
                2. Create your first task<br>
                3. Set up your first focus session<br>
                4. Start tracking your wellness journey</p>
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to TimeCraft!

Hi {{FIRST_NAME}}!

Welcome to TimeCraft, your all-in-one productivity and wellness companion! We're excited to help you achieve your goals and build better habits.

What you can do with TimeCraft:
- Smart task management with AI prioritization
- Focus sessions and Pomodoro timers
- Health and fitness tracking
- Mindfulness and reflection journaling
- Progress analytics and insights

Get Started:
1. Complete your profile setup
2. Create your first task
3. Set up your first focus session
4. Start tracking your wellness journey

If you have any questions, feel free to reach out to our support team.

© 2025 TimeCraft. All rights reserved.
        `
      },
      de: {
        subject: 'Willkommen bei TimeCraft! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Willkommen bei TimeCraft</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Willkommen bei TimeCraft!</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Ihre Reise zu besserer Produktivität und Wellness beginnt jetzt</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hallo {{FIRST_NAME}}! 👋</h2>
              <p>Willkommen bei TimeCraft, Ihrem All-in-One-Produktivitäts- und Wellness-Begleiter! Wir freuen uns, Ihnen dabei zu helfen, Ihre Ziele zu erreichen und bessere Gewohnheiten aufzubauen.</p>
              
              <h3 style="color: #667eea;">Was Sie mit TimeCraft tun können:</h3>
              <ul style="color: #555;">
                <li>📋 Intelligentes Aufgabenmanagement mit KI-Priorisierung</li>
                <li>⏰ Fokussitzungen und Pomodoro-Timer</li>
                <li>🏃‍♀️ Gesundheits- und Fitness-Tracking</li>
                <li>🧘‍♀️ Achtsamkeit und Reflexions-Tagebuch</li>
                <li>📊 Fortschrittsanalysen und Einblicke</li>
              </ul>
              
              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #667eea; margin-top: 0;">Erste Schritte:</h4>
                <p style="margin-bottom: 0;">1. Vervollständigen Sie Ihr Profil<br>
                2. Erstellen Sie Ihre erste Aufgabe<br>
                3. Richten Sie Ihre erste Fokussitzung ein<br>
                4. Beginnen Sie mit dem Tracking Ihrer Wellness-Reise</p>
              </div>
              
              <p>Wenn Sie Fragen haben, wenden Sie sich gerne an unser Support-Team.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. Alle Rechte vorbehalten.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
Willkommen bei TimeCraft!

Hallo {{FIRST_NAME}}!

Willkommen bei TimeCraft, Ihrem All-in-One-Produktivitäts- und Wellness-Begleiter! Wir freuen uns, Ihnen dabei zu helfen, Ihre Ziele zu erreichen und bessere Gewohnheiten aufzubauen.

Was Sie mit TimeCraft tun können:
- Intelligentes Aufgabenmanagement mit KI-Priorisierung
- Fokussitzungen und Pomodoro-Timer
- Gesundheits- und Fitness-Tracking
- Achtsamkeit und Reflexions-Tagebuch
- Fortschrittsanalysen und Einblicke

Erste Schritte:
1. Vervollständigen Sie Ihr Profil
2. Erstellen Sie Ihre erste Aufgabe
3. Richten Sie Ihre erste Fokussitzung ein
4. Beginnen Sie mit dem Tracking Ihrer Wellness-Reise

Wenn Sie Fragen haben, wenden Sie sich gerne an unser Support-Team.

© 2025 TimeCraft. Alle Rechte vorbehalten.
        `
      }
    };
  }

  private getNotificationTemplates(): Record<string, EmailTemplate> {
    return {
      en: {
        subject: 'TimeCraft Notification: {{TITLE}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TimeCraft Notification</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Personal Productivity & Wellness Companion</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">{{TITLE}}</h2>
              <p>{{MESSAGE}}</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft Notification

{{TITLE}}

{{MESSAGE}}

© 2025 TimeCraft. All rights reserved.
        `
      },
      de: {
        subject: 'TimeCraft-Benachrichtigung: {{TITLE}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TimeCraft-Benachrichtigung</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TimeCraft</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Ihr persönlicher Produktivitäts- und Wellness-Begleiter</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">{{TITLE}}</h2>
              <p>{{MESSAGE}}</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                © 2025 TimeCraft. Alle Rechte vorbehalten.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
TimeCraft-Benachrichtigung

{{TITLE}}

{{MESSAGE}}

© 2025 TimeCraft. Alle Rechte vorbehalten.
        `
      }
    };
  }
}

// Factory function to create email service
export function createEmailService(env: any): EmailService {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.FROM_EMAIL || 'noreply@qura.co.ke';
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required for email service');
  }
  
  return new EmailService(apiKey, fromEmail);
}
