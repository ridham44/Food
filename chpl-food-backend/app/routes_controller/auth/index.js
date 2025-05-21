const router = require('express').Router();
const controller = require('./controller.js');

router.post('/login', controller.login);

module.exports = router;
