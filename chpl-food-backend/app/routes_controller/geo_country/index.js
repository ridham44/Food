const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules ,updateValidations} = require('./lib/validation');
const controller = require('./lib/controller');

// create country
router.post('/country', auth, validationRules(), expressValidate, controller.create);

// update country
router.put('/country/:id', auth, updateValidations(), expressValidate, controller.update);

// delete country
router.delete('/country/:id', auth, controller.delete);

// get all with filter
router.post('/country-filter', auth, controller.countryFiltration);

// get filter options
router.get('/country-filter/options', auth, controller.countryForFilter);

// get all country
router.get('/country', auth, controller.findAll);

//get country Options
router.get('/country/options', auth, controller.findAll);

// find by id
router.get('/country/:id', auth, controller.findById);

// update country status
router.put('/country/status/:id', auth, controller.updateStatus);

module.exports = router;
