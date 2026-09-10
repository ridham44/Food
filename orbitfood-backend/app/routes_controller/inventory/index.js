const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

router.post('/inventory-item', auth, controller.create);
router.put('/inventory-item/:id', auth, controller.update);
router.delete('/inventory-item/:id', auth, controller.delete);
router.get('/inventory-item/:id', auth, controller.findById);
router.get('/inventory-item/:id/movements', auth, controller.movements);

// List + search/category/status filter
router.post('/inventory-item-filter', auth, controller.filtration);

// Restock / usage / adjustment — creates a movement row and updates currentStock
router.post('/inventory-item/update-stock', auth, controller.updateStock);

module.exports = router;
