const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_KEY,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const result = await transporter.sendMail({
      from: `"Job Recommendation APP : " <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email envoyé via Gmail :', result);
  } catch (error) {
    console.error('Erreur envoi email Gmail :', error);
    throw error;
  }
};

module.exports = sendEmail;