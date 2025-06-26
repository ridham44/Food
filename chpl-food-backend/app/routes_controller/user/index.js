const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { status } = require('../../../utils');
const fs = require('fs');
const multer = require('multer');

const { loginRules, createUserRules, updateUserRules, loginWithAuthRules, changePassword } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

const allowedType = ['image/png', 'image/jpeg', 'image/jpg'];

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `./uploads/userProfile`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const filename = file.originalname.replace(/\\s+/g, '_');
        cb(null, Date.now() + filename);
    },
});

const fileFilter = (req, file, cb) => {
    if (allowedType.includes(file.mimetype)) {
        return cb(null, true);
    } else {
        req.fileValidationError = true;
        return cb(new Error('File validation error'), false);
    }
};

const multerMiddleware = (err, req, res, next) => {
    const removeUploadedFile = () => {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    };
    if (err instanceof multer.MulterError) {
        removeUploadedFile();
        return res.status(status.InternalServerError).json({ message: 'File upload error!', error: err.message });
    }
    if (req.fileValidationError) {
        removeUploadedFile();
        return res.status(status.BadRequest).json({ message: 'Only .png, .jpg, and .jpeg format allowed!' });
    }
    if (err) {
        removeUploadedFile();
        return res.status(status.InternalServerError).json({ message: 'Unexpected file upload error', error: err.message });
    }
    next();
};

// multer upload object
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
});

// Login With Password
router.post('/login/with-password', loginRules(), expressValidate, controller.loginWithPassword);

// Login With Auth
router.post('/login/with-auth', loginWithAuthRules(), expressValidate, controller.loginWithSocial);

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
router.put('/forgot-password', controller.forgotPassword);

module.exports = router;
