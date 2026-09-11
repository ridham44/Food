const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');

const { loginRules, createUserRules, updateUserRules, loginWithAuthRules, changePassword } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');
const { authLimiter } = require('../../middlewares/rateLimiters');
const { createImageUpload, handleUploadErrors } = require('../../../utils/lib/imageUpload');

// multer upload object
const uploads = createImageUpload('userProfile');
const multerMiddleware = handleUploadErrors;

// Login With Password
router.post('/login/with-password', authLimiter, loginRules(), expressValidate, controller.loginWithPassword);

// Login With Auth
router.post('/login/with-auth', authLimiter, loginWithAuthRules(), expressValidate, controller.loginWithSocial);

// create user
router.post('/user', auth, uploads.single('profileImage'), multerMiddleware, createUserRules(), expressValidate, controller.create);

// get all user
router.post('/user-filter', auth, controller.userFiltration);

// filter options
router.get('/user-filter/options', auth, controller.userForFilter);

// get user
router.get('/user/:id', auth, controller.findById);

// update user
router.put('/user/:id', auth, uploads.single('profileImage'), multerMiddleware, updateUserRules(), expressValidate, controller.update);

// update user status
router.put('/user/status/:id', auth, controller.updateStatus);

// delete user
router.delete('/user/:id', auth, controller.delete);

// change password
router.put('/profile/change-password', auth, changePassword(), expressValidate, controller.changePassword);

// forgot-password
router.put('/forgot-password', authLimiter, controller.forgotPassword);

module.exports = router;
