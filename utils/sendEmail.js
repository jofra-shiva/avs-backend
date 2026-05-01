const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPass) {
    console.error('ERROR: SMTP_EMAIL or SMTP_PASSWORD environment variables are missing.');
    throw new Error('CONFIG_ERROR: Email configuration is incomplete on the server dashboard.');
  }

  console.log(`[SMTP] Initializing transporter for: ${smtpEmail.split('@')[0].slice(0, 3)}...${smtpEmail.split('@')[0].slice(-1)}@${smtpEmail.split('@')[1]}`);
  console.log(`[SMTP] Password length: ${smtpPass.length} chars (Masked: ${smtpPass.slice(0, 2)}...${smtpPass.slice(-2)})`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465, // Using port 465 for SSL (More reliable on Vercel)
    secure: true, // Port 465 requires secure: true
    auth: {
      user: smtpEmail,
      pass: smtpPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"AVSECO" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer Error:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
