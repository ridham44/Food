const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const adminOnly = require('../../middlewares/adminMiddleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const { status } = require('../../../utils');

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

// Multer config
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
});

// Create tenant
router.post(
    '/tenant',
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
router.delete('/tenant/:id', auth, adminOnly, controller.delete);

// Get all tenants (platform admin only — a regular tenant has no business
// browsing other restaurants' full records)
router.get('/tenant', auth, adminOnly, controller.findAll);

// Public, unauthenticated restaurant directory for the customer app. Must be
// registered before `/tenant/:id` below, or "public-list" would be swallowed
// as an :id param.
router.get('/tenant/public-list', controller.publicList);
router.get('/tenant/public/:id', controller.publicById);

// Resolve the authenticated user's own tenant (no id lookup needed)
// Must be registered before the `/tenant/:id` route below, or "current" would
// be swallowed as an :id param.
router.get('/tenant/current', auth, controller.getCurrent);

// Get tenant by ID
router.get('/tenant/:id', auth, controller.findById);

// Tenant filter options
router.get('/tenant-filter/options', auth, adminOnly, controller.tenantForFilter);

// Tenant filtration
router.post('/tenant-filter', auth, adminOnly, controller.tenantFiltration);

// Update tenant status (approve/reject) — admin-only, enforced again inside
// the controller since this action also writes approvedBy/rejectedBy audit fields
router.put('/tenant/status/:id', auth, adminOnly, controller.updateStatus);

// Finding tenants by created user ID
router.get('/tenant/by-user/:userId', auth, adminOnly, controller.findByCreatedUserId);

// Finding with date
router.post('/tenant/filter', auth, adminOnly, controller.filtration);

module.exports = router;
