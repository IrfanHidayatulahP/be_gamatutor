const { register, login, loginGoogle, getMe, logout, refresh, forgotPassword, resetPassword } = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, role, status } = req.body;

    const { user, token } = await register({
      email,
      password,
      firstName,
      lastName,
      username,
      role,
      status
    });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const registerUserbyGoogle = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, role, status } = req.body;

    const { user, token } = await register({
      email,
      password: 'GOOGLE_AUTH',
      firstName,
      lastName,
      username,
      role: 'user',
      status: 'online'
    });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await login(email, password);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const loginByGoogle = async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    const { user, token } = await loginGoogle(email);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(401).json({ message: 'Google token invalid' });
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getMe(req.user.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.split(' ')[1];
    await logout(req.user.userId, currentToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { user, token } = await refresh(req.user.userId);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ error: 'Email tidak terdaftar' });

    // Buat token acak (20 bytes hex = 40 karakter)
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set expired 15 menit dari sekarang
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); 
    await user.save();

    // Kirim Email
    const previewUrl = await sendResetPasswordEmail(email, resetToken);

    res.json({ 
      message: 'Email reset password telah dikirim. Cek inbox kamu.', 
      previewUrl // Hanya untuk testing (bisa dihapus di production)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Cari user berdasarkan token DAN cek apakah expired
    const user = await User.findOne({ 
      where: { 
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() } // Token expiry > waktu sekarang
      } 
    });

    if (!user) return res.status(400).json({ error: 'Token tidak valid atau sudah kadaluarsa' });

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    user.resetToken = null;         // Hapus token agar tidak bisa dipakai lagi
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password berhasil direset. Silakan login kembali.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, registerUserbyGoogle, loginUser, loginByGoogle, getCurrentUser, logoutUser, refreshToken, forgotPasswordController, resetPasswordController };