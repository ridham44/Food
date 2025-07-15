const router = require('express').Router();
const controller = require('./lib/controller.js');
const { customerLoginValidator, createCustomerValidator, validateUpdate } = require('./lib/validation.js');
const auth = require('../../middlewares/middleware');

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

module.exports = router;
