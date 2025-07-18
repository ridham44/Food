const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validateTenantId } = require('./lib/validation');
const auth = require('../../middlewares/CustomerMiddlewear');

router.post('/order/customer', auth, validateTenantId(), expressValidate, controller.orderCustomer);

router.post('/order/approve-or-reject', auth, controller.approveOrRejectOrder);

router.post('/order/tenant', auth, controller.tenantPlaceOrder);

router.post('/order/order-item-quantity', auth, controller.updateOrderItemQuantity);

router.post('/order/item', auth, controller.addOrderItem);
module.exports = router;
