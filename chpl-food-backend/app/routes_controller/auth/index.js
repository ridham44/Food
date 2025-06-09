const router = require('express').Router();
const controller = require('./controller.js');
const auth = require('../../middlewares/middleware');

// Login route
router.post('/login', controller.login);
// Change password route
router.post('/change-password', auth, controller.changePassword);

// Find users by created user ID
router.get('/user/by-user/:userId',auth, controller.findUserByCreatedUserId);

module.exports = router;