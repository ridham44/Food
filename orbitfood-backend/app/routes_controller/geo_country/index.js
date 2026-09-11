const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const adminOnly = require('../../middlewares/adminMiddleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');
const { createImageUpload, handleUploadErrors } = require('../../../utils/lib/imageUpload');

// Multer upload config
const uploads = createImageUpload('country_flag');
const multerMiddleware = handleUploadErrors;

// create country — shared platform reference data, admin-only
router.post('/country', auth, adminOnly, uploads.single('flag'), multerMiddleware, validationRules(), expressValidate, controller.create);

// update country
router.put('/country/:id', auth, adminOnly, uploads.single('flag'), multerMiddleware, updateValidations(), expressValidate, controller.update);

// delete country
router.delete('/country/:id', auth, adminOnly, controller.delete);

// get all with filter
router.post('/country-filter', auth, controller.countryFiltration);

// get filter options
router.get('/country-filter/options', auth, controller.countryForFilter);

// get all country
router.get('/country', auth, controller.findAll);

// Public, unauthenticated lookup for the customer signup/address form
router.get('/public/country/options', controller.findAll);

//get country Options
router.get('/country/options', auth, controller.findAll);

// find by id
router.get('/country/:id', auth, controller.findById);

// update country status
router.put('/country/status/:id', auth, adminOnly, controller.updateStatus);

// Finding with date
router.post('/country/filter', auth, controller.filtration);

module.exports = router;
