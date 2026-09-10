const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');

router.post('/activityLog', auth, controller.list);

module.exports = router;
