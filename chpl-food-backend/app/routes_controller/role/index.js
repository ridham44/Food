const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

router.post('/', auth, validationRules(), expressValidate, controller.create);

router.put('/:id', auth, updateValidations(), expressValidate, controller.update);

router.delete('/:id', auth, controller.delete);

router.get('/', auth, controller.findAll);

router.get('/:id', auth, controller.findById);

router.get('/role-filter/options', auth, controller.roleForFilter);

router.post('/role-filter', auth, controller.roleFiltration);

router.put('/status/:id', auth, controller.updateStatus);


module.exports = router;
