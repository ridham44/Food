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
        const filename = file.originalname.replace(/\s+/g, '_');
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
    let errorMessage = 'File upload error!';
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            errorMessage = 'File size too large!';
        }
        return res.status(status.InternalServerError).json({ message: errorMessage });
    }
    if (req.fileValidationError) {
        return res.status(status.BadRequest).json({ message: 'Only .png, .jpg, and .jpeg format allowed!' });
    }
    next();
};

// multer upload object
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
});

// Create user
router.post('/', auth, uploads.single('profileImage'), multerMiddleware, createUserRules(), expressValidate, controller.create);

// Get all users (paginated with filter)
router.post('/user-filter', auth, controller.userFiltration);

// Get filter dropdown options
router.get('/user-filter/options', auth, controller.userForFilter);

// Get user by ID
router.get('/:id', auth, controller.findById);

// Update user
router.put('/:id', auth, uploads.single('profileImage'), multerMiddleware, updateUserRules(), expressValidate, controller.update);

// Update user status
router.put('/status/:id', auth, controller.updateStatus);

// Delete user
router.delete('/:id', auth, controller.delete);

// Change user password (profile)
router.put('/profile/change-password', auth, changePassword(), expressValidate, controller.changePassword);

// Forgot password
router.put('/forgot-password', controller.forgotPassword);

// Login with password
router.post('/login/with-password', loginRules(), expressValidate, controller.loginWithPassword);

// Login with auth (e.g. social login)
router.post('/login/with-auth', loginWithAuthRules(), expressValidate, controller.loginWithSocial);

module.exports = router;
