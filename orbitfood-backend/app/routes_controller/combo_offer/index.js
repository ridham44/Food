const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const {
    validateCreateComboGroup,
    validateComboGroupItem,
    validateUpdateComboGroupItem,
    validateUpdateComboGroup,
} = require('./lib/validation');

// Create a new combo group
router.post('/combo/group', auth, validateCreateComboGroup(), expressValidate, controller.createComboGroup);

// Update an existing combo group
router.put('/combo/group/:id', auth, validateUpdateComboGroup(), expressValidate, controller.updateComboGroup);

// update combo group item
router.put('/combo/group-item/:id', auth, validateUpdateComboGroupItem(), expressValidate, controller.updateComboGroupItem);

// add combo group item
router.post('/combo/group-item', auth, validateComboGroupItem(), expressValidate, controller.addComboGroupItem);

// Delete a combo group item
router.delete('/combo/group-item/:id', auth, controller.deleteComboGroupItem);

// Delete a combo group
router.delete('/combo/:id', auth, controller.deleteCombo);

// Get all combos
router.get('/combo-list', auth, controller.getAllCombos);

// Get combo by ID
router.get('/combo/:id', auth, controller.getComboById);

// Update combo status of combo
router.put('/combo/status/:id', auth, controller.updateComboStatus);

module.exports = router;
