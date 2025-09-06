import nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Create email transporter (configure based on your email service)
const transporter = nodemailer.createTransport({
  // For development/testing - use a service like MailHog or similar
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false, // true for 465, false for other ports
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

// Email templates
const templates = {
  'team-invitation': (data: any) => ({
    subject: `Invitation to join ${data.organizationName} on GEO Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to join ${data.organizationName}</h2>
        
        <p>You have been invited to join <strong>${data.organizationName}</strong> on GEO Platform as a <strong>${data.role}</strong>.</p>
        
        ${data.message ? `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic;">${data.message}</blockquote>` : ''}
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.inviteUrl}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This invitation will expire on ${data.expiresAt}. 
          If you don't want to join this organization, you can ignore this email.
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #666; font-size: 12px;">
          This email was sent by GEO Platform. If you didn't expect this invitation, please ignore this email.
        </p>
      </div>
    `,
    text: `
      You're invited to join ${data.organizationName} on GEO Platform
      
      You have been invited to join ${data.organizationName} as a ${data.role}.
      
      ${data.message ? `Message: ${data.message}\n` : ''}
      
      Accept your invitation: ${data.inviteUrl}
      
      This invitation expires on ${data.expiresAt}.
    `
  })
};

export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    const template = templates[emailData.template as keyof typeof templates];
    
    if (!template) {
      throw new Error(`Template "${emailData.template}" not found`);
    }

    const { subject, html, text } = template(emailData.data);

    const mailOptions = {
      from: process.env.SMTP_FROM || '"GEO Platform" <noreply@geoplatform.example.com>',
      to: emailData.to,
      subject: emailData.subject || subject,
      html,
      text
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        template: emailData.template
      });
      // In development, don't actually send emails unless SMTP is configured
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}