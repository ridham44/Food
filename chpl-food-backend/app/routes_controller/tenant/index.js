const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const { status } = require('../../../utils');

// Allowed image MIME types
const allowedType = ['image/png', 'image/jpeg', 'image/jpg'];

// Storage config
const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `./uploads/tenant`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const filename = file.originalname.replace(/\s+/g, '_');
        cb(null, Date.now() + '_' + filename);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    if (allowedType.includes(file.mimetype)) {
        return cb(null, true);
    } else {
        req.fileValidationError = true;
        return cb(new Error('File validation error'), false);
    }
};

// Multer error handling
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

// Multer config
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
});

// Routes

// Create tenant
router.post(
    '/tenant',
    auth,
    uploads.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
    ]),
    multerMiddleware,
    validationRules(),
    expressValidate,
    controller.create
);

// Update tenant
router.put(
    '/tenant/:id',
    auth,
    uploads.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
    ]),
    multerMiddleware,
    updateValidations(),
    expressValidate,
    controller.update
);

// Delete tenant
router.delete('/tenant/:id', auth, controller.delete);

// Get all tenants
router.get('/tenant', auth, controller.findAll);

// Get tenant by ID
router.get('/tenant/:id', auth, controller.findById);

// Tenant filter options
router.get('/tenant-filter/options', auth, controller.tenantForFilter);

// Tenant filtration
router.post('/tenant-filter', auth, controller.tenantFiltration);

// Update tenant status
router.put('/tenant/status/:id', auth, controller.updateStatus);

// Finding tenants by created user ID
router.get('/tenant/by-user/:userId',auth, controller.findByCreatedUserId);


module.exports = router;
