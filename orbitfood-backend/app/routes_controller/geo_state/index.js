const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const adminOnly = require('../../middlewares/adminMiddleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');

// Shared platform reference data (no tenantId column) — admin-only writes
//create state
router.post('/state', auth, adminOnly, validationRules(), expressValidate, controller.create);

//update state
router.put('/state/:id', auth, adminOnly, updateValidations(), expressValidate, controller.update);

//delete state
router.delete('/state/:id', auth, adminOnly, controller.delete);

//get all with filter
router.post('/state-filter', auth, controller.stateFiltration);

//get filter options
router.get('/state-filter/options', auth, controller.stateForFilter);

//get all state
router.get('/state', auth, controller.findAll);

// Public, unauthenticated lookup for the customer signup/address form
router.get('/public/state/cascade/:id/options', controller.findAll);

// get all state by country id
router.get('/state/cascade/:id', auth, controller.findAll);

//get state options
router.get('/state/options', auth, controller.findAll);

//find by id
router.get('/state/:id', auth, controller.findById);

//update state status
router.put('/state/status/:id', auth, adminOnly, controller.updateStatus);

// Finding with date
router.post('/state/filter', auth, controller.filtration);

module.exports = router;
