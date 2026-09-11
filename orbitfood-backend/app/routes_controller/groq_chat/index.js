const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/middleware');
const Customerauth = require('../../middlewares/CustomerMiddlewear');
const adminOnly = require('../../middlewares/adminMiddleware');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { askAiValidation } = require('./lib/validation');
const { aiLimiter } = require('../../middlewares/rateLimiters');

// Route to get the Order chat
router.post('/ask-order-ai', aiLimiter, auth, askAiValidation(), expressValidate, controller.askOrderAI);

// Route to get the Tenant chat
router.post('/ask-tenant-ai', aiLimiter, auth, askAiValidation(), expressValidate, controller.askTenantAI);

// Route to get the admin AI chat — queries platform-wide data across every
// tenant, so this must be platform-admin only, not any authenticated tenant user.
router.post('/ask-admin-ai', aiLimiter, auth, adminOnly, askAiValidation(), expressValidate, controller.askAdminAI);

// Route to get the Customer AI chat
router.post('/ask-customer-ai', aiLimiter, Customerauth, askAiValidation(), expressValidate, controller.askCustomerAI);

// Generic chat completion for agentic tool use — proxies to the paid Groq
// API, so it must require a logged-in caller (customer or staff) or it's an
// open, unauthenticated relay anyone can use to burn the API quota.
router.post('/chat', aiLimiter, Customerauth, controller.chatWithTools);

module.exports = router;
