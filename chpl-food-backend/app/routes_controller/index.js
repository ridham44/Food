const router = require('express').Router();

router.use('/', require('./user'));
router.use('/', require('./geo_country'));
router.use('/', require('./geo_city'));
router.use('/', require('./geo_state'));
module.exports = router;
