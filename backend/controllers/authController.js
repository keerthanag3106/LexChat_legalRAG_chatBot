const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email exists' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const language = req.body.language || 'en';  // Get language preference or default to English
    const user = new User({ name, email, passwordHash, language });
    await user.save();
    console.log("REGISTER BODY:", req.body);//added
    return res.json({ message: 'Registered' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, language: user.language } });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLanguage = async (req, res) => {
  const { language } = req.body;
  if (!language || !['en', 'hi'].includes(language)) {
    return res.status(400).json({ message: 'Invalid language' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.language = language;
    await user.save();
    return res.json({ message: 'Language updated', language: user.language });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};
