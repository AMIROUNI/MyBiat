const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth.middleware'); // Add this

// Vue pages
router.get('/register', userController.showRegister);
router.get('/login', userController.showLogin);

// Protected routes (require login)
router.get('/dashboard', isAuthenticated, userController.dashboard);
router.get('/transfer', isAuthenticated, userController.showTransfer);

router.get('', userController.showLoading);
router.get('/account', userController.showAccount);

// Actions
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/transfer', isAuthenticated, userController.transferMoney); // Also protect this




// Logout
router.get('/logout', userController.logout);

module.exports = router;    