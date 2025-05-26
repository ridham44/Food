const router = require('express').Router();

router.use('/', require('./user'));
router.use('/', require('./geo_country'));
router.use('/', require('./geo_city'));
router.use('/', require('./geo_state'));
router.use('/', require('./auth'));
router.use('/', require('./tenant'));
router.use('/', require('./role'));
router.use('/', require('./menu'));
router.use('/', require('./setting'));

module.exports = router;
