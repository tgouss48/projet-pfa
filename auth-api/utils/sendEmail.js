const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const result = await transporter.sendMail({
      from: `"CareerCompass" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email envoyé via PrivateEmail (Namecheap) :', result);
  } catch (error) {
    console.error('Erreur envoi email :', error);
    throw error;
  }
};

module.exports = sendEmail;