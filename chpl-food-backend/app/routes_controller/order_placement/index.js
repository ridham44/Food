const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validateTenantId, validatereorder } = require('./lib/validation');
const auth = require('../../middlewares/CustomerMiddlewear');

router.post('/order/customer', auth, validateTenantId(), expressValidate, controller.orderCustomer);

router.post('/order/approve-or-reject', auth, controller.approveOrRejectOrder);

router.post('/order/tenant', auth, controller.tenantPlaceOrder);

router.post('/order/order-item-quantity', auth, controller.updateOrderItemQuantity);

router.post('/order/item', auth, controller.addOrderItem);

router.post('/order/prev', auth, validatereorder(), expressValidate, controller.reorderFromPreviousOrder);

const staffAuth = require('../../middlewares/middleware');

// Kitchen prep workflow: new -> preparing -> ready -> completed, or 'cancelled' (requires cancelReason)
router.patch('/order/kitchen-status/:id', staffAuth, controller.updateKitchenStatus);

// Generic paginated order list for the tenant dashboard (list + kanban views)
router.get('/order/list', staffAuth, controller.listOrders);

module.exports = router;
