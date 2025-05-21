
const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/user', require('./user'));
router.use('/geo_country', require('./geo_country'));
router.use('/geo_city', require('./geo_city'));
router.use('/geo_state', require('./geo_state'));
router.use('/tenant', require('./tenant'));
router.use('/role', require('./role'));
router.use('/menu', require('./menu'));
router.use('/setting', require('./setting'));

module.exports = router;
