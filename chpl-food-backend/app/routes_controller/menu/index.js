const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const { status } = require('../../../utils');

// Allowed image MIME types
const allowedType = ['image/png', 'image/jpeg', 'image/jpg'];

// Multer storage config
const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `./uploads/menu`;
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

// Multer middleware
const multerMiddleware = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(status.InternalServerError).json({ message: 'File upload error!', error: err.message });
    }
    if (req.fileValidationError) {
        return res.status(status.BadRequest).json({ message: 'Only .png, .jpg, and .jpeg format allowed!' });
    }
    if (err) {
        return res.status(status.InternalServerError).json({ message: 'Unexpected file upload error', error: err.message });
    }
    next();
};

// Multer upload config
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/menu', auth, uploads.single('filePath'), multerMiddleware, validationRules(), expressValidate, controller.create);
router.put('/menu/:id', auth, uploads.single('filePath'), multerMiddleware, updateValidations(), expressValidate, controller.update);
// Delete menu
router.delete('/menu/:id', auth, controller.delete);

// Get all menus
router.get('/menu', auth, controller.findAll);

// Get menu by ID
router.get('/menu/:id', auth, controller.findById);

// Menu filtration
router.post('/menu-filter', auth, controller.menuFiltration);

// Menu filter options
router.get('/menu-filter/options', auth, controller.menuForFilter);

module.exports = router;
