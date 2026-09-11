const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { addressValidation } = require('./lib/validation');
const auth = require('../../middlewares/CustomerMiddlewear');

router.post('/customer/address', auth, addressValidation(), expressValidate, controller.createAddress);
router.get('/customer/address', auth, controller.listAddresses);
router.get('/customer/address/:id', auth, controller.getAddress);
router.put('/customer/address/:id', auth, addressValidation(), expressValidate, controller.updateAddress);
router.delete('/customer/address/:id', auth, controller.deleteAddress);
router.patch('/customer/address/:id/default', auth, controller.setDefaultAddress);

module.exports = router;
