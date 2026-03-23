const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword, updateProfilePassword, updateMe, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateMe);
router.put('/change-password', verifyToken, changePassword);
router.put('/update-password', verifyToken, updateProfilePassword);

module.exports = router;
