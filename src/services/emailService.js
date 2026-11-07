// const nodemailer = require('nodemailer');

// exports.sendResetPasswordEmail = async (email, token) => {
//   try {
//     // Setup akun Ethereal (Testing)
//     const testAccount = await nodemailer.createTestAccount();
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.ethereal.email',
//       port: 587,
//       auth: { user: testAccount.user, pass: testAccount.pass }
//     });

//     const info = await transporter.sendMail({
//       from: '"Gamatutor Support" <support@gamatutor.com>',
//       to: email,
//       subject: 'Reset Password Gamatutor',
//       html: `
//         <h3>Permintaan Reset Password</h3>
//         <p>Kamu menerima email ini karena ada permintaan reset password.</p>
//         <p>Gunakan token berikut untuk mereset passwordmu:</p>
//         <h2 style="background:#eee; padding:10px; text-align:center; font-family:monospace;">${token}</h2>
//         <p>Token ini hanya berlaku selama 15 menit.</p>
//         <p>Jika kamu tidak meminta reset password, abaikan email ini.</p>
//       `,
//     });

//     // ★ Simpan link ini di console backend untuk ngecek email!
//     console.log("Preview Email URL: %s", nodemailer.getTestMessageUrl(info));
//     return nodemailer.getTestMessageUrl(info);
//   } catch (error) {
//     console.error("Email error:", error);
//     throw error;
//   }
// };

const nodemailer = require('nodemailer');

exports.sendResetPasswordEmail = async (email, token) => {
  try {
    // Setup akun Ethereal (Testing)
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const info = await transporter.sendMail({
      from: '"Gamatutor Support" <support@gamatutor.com>',
      to: email,
      subject: 'Reset Password Gamatutor',
      html: `
        <h3>Permintaan Reset Password</h3>
        <p>Kamu menerima email ini karena ada permintaan reset password.</p>
        <p>Gunakan token berikut untuk mereset passwordmu:</p>
        <h2 style="background:#eee; padding:10px; text-align:center; font-family:monospace;">${token}</h2>
        <p>Token ini hanya berlaku selama 15 menit.</p>
        <p>Jika kamu tidak meminta reset password, abaikan email ini.</p>
      `,
    });

    // ★ Simpan link ini di console backend untuk ngecek email!
    console.log("Preview Email URL: %s", nodemailer.getTestMessageUrl(info));
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};