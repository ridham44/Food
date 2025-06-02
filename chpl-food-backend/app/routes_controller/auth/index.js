const router = require('express').Router();
const controller = require('./controller.js');
const auth = require('../../middlewares/middleware');

router.post('/login', controller.login);
router.post('/change-password', auth, controller.changePassword);

module.exports = router;
