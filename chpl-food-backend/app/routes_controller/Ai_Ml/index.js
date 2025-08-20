const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

router.post('/sales-forecast', auth, controller.salesForecast);

module.exports = router;
