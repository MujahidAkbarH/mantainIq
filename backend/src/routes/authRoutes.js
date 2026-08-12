const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getTechnicians } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);
router.get('/technicians', verifyToken, requireAdmin, getTechnicians);


module.exports = router;
