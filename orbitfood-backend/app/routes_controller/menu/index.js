const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const authCustomer = require('../../middlewares/CustomerMiddlewear')
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const { createImageUpload, handleUploadErrors } = require('../../../utils/lib/imageUpload');

const uploads = createImageUpload('menu');
const multerMiddleware = handleUploadErrors;

router.post('/menu', auth, uploads.single('filePath'), multerMiddleware, validationRules(), expressValidate, controller.create);
router.put('/menu/:id', auth, uploads.single('filePath'), multerMiddleware, updateValidations(), expressValidate, controller.update);
// Delete menu
router.delete('/menu/:id', auth, controller.delete);

// Get all menus
router.get('/menu', auth, controller.findAll);

// Get menu by ID
router.get('/menu/:id', auth, controller.findById);

// Menu filtration
router.post('/menu-filter', auth, controller.menuFiltration);

// Menu filter options
router.get('/menu-filter/options', auth, controller.menuForFilter);

// Finding with date
router.post('/menu/filter', auth, controller.filtration);

// Customer menu routes
router.get('/menu-customer/:tenantId', authCustomer, controller.findByIdForCustomer);

//Update updateAvailability
router.put('/menu/status/:id', auth, controller.updateAvailability);

module.exports = router;
