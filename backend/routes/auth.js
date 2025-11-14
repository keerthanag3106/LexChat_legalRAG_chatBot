const express = require('express');
const router = express.Router();
const { register, login, updateLanguage } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.put('/language', auth, updateLanguage);

module.exports = router;
