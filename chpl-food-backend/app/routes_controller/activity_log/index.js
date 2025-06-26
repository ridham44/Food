const express = require('express');
const router = express.Router();
const controller = require('../../routes_controller/activity_log/Controller');
const auth = require('../../middlewares/middleware');

router.post('/activityLog', auth, controller.list);

module.exports = router;
