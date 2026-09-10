const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/middleware');
const Customerauth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { askAiValidation } = require('./lib/validation');
const { aiLimiter } = require('../../middlewares/rateLimiters');

// Route to get the Order chat
router.post('/ask-order-ai', aiLimiter, auth, askAiValidation(), expressValidate, controller.askOrderAI);

// Route to get the Tenant chat
router.post('/ask-tenant-ai', aiLimiter, auth, askAiValidation(), expressValidate, controller.askTenantAI);

// Route to get the admin AI chat
router.post('/ask-admin-ai', aiLimiter, auth, askAiValidation(), expressValidate, controller.askAdminAI);

// Route to get the Customer AI chat
router.post('/ask-customer-ai', aiLimiter, Customerauth, askAiValidation(), expressValidate, controller.askCustomerAI);

// Generic chat completion for agentic tool use
router.post('/chat', aiLimiter, controller.chatWithTools);

module.exports = router;
