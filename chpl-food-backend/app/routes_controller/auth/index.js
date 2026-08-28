const router = require('express').Router();
const controller = require('./lib/controller.js');
const { customerLoginValidator, createCustomerValidator, validateUpdate } = require('./lib/validation.js');
const auth = require('../../middlewares/middleware');
const authCustomer = require('../../middlewares/CustomerMiddlewear');

// Login route
router.post('/login', controller.login);

// Change password route
router.post('/change-password', auth, controller.changePassword);

// Finding with date
router.post('/user/common-filter', auth, controller.filtration);

//  Corrected Customer login route
router.post('/customer-login', customerLoginValidator, controller.customerlogin);

//  Corrected Create customer route (was: createCustomer)
router.post('/customer-create', createCustomerValidator, controller.create);

//  Corrected Update customer route
router.put('/customer-update/:id', auth, validateUpdate, controller.update);

//  Corrected delete customer route
router.delete('/customer-delete/:id', auth, controller.delete);

// Tenant-scoped customer list + profile (Customer has no tenantId; derived via this tenant's orders)
router.get('/customer/list', auth, controller.customerList);
router.get('/customer/:id/profile', auth, controller.customerProfile);

// Customer app self-service profile — scoped to the caller's own id
router.get('/customer/me', authCustomer, controller.me);
router.put('/customer/me', authCustomer, controller.updateMe);

module.exports = router;
