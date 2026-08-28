const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');

//create state
router.post('/state', auth, validationRules(), expressValidate, controller.create);

//update state
router.put('/state/:id', auth, updateValidations(), expressValidate, controller.update);

//delete state
router.delete('/state/:id', auth, controller.delete);

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
router.put('/state/status/:id', auth, controller.updateStatus);

// Finding with date
router.post('/state/filter', auth, controller.filtration);

module.exports = router;
