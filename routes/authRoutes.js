const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword, updateProfilePassword, updateMe, getMe, forgotPassword, resetPassword, getMySalary } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateMe);
router.put('/change-password', verifyToken, changePassword);
router.put('/update-password', verifyToken, updateProfilePassword);
router.get('/my-salary', verifyToken, getMySalary);

module.exports = router;
