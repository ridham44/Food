const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');
const { validateTenantId } = require('./lib/validation');
const auth = require('../../middlewares/CustomerMiddlewear');

router.post('/order-customer', auth, validateTenantId, controller.orderCustomer);

router.post('/approve-or-reject-order', auth, controller.approveOrRejectOrder);

router.post('/order-tenant', auth, controller.tenantPlaceOrder);

router.post('/update-order-item-quantity', auth, controller.updateOrderItemQuantity);

router.post('/add-order', auth, controller.addOrderItem);
module.exports = router;
