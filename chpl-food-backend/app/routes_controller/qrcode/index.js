const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');

router.get('/generate-login-qr', controller.generateLoginQr);

module.exports = router;
