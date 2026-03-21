const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
