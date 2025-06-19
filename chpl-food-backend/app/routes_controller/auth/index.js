const router = require('express').Router();
const controller = require('./controller.js');
const auth = require('../../middlewares/middleware');

// Login route
router.post('/login', controller.login);
// Change password route
router.post('/change-password', auth, controller.changePassword);
// Finding with date
router.post('/user/common-filter', auth, controller.filtration);

module.exports = router;
