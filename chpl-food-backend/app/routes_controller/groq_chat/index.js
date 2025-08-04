const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { askAiValidation } = require('./lib/validation');

router.post('/ask-order-ai', auth, askAiValidation(), expressValidate, controller.askOrderAI);

module.exports = router;
