const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');
const { status } = require('../../../utils');

// Allowed image MIME types
const allowedType = ['image/png', 'image/jpeg', 'image/jpg'];

// Multer storage config
const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `./uploads/country_flag`;
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

// create country
router.post('/country', auth, uploads.single('flag'), multerMiddleware, validationRules(), expressValidate, controller.create);

// update country
router.put('/country/:id', auth, uploads.single('flag'), multerMiddleware, updateValidations(), expressValidate, controller.update);

// delete country
router.delete('/country/:id', auth, controller.delete);

// get all with filter
router.post('/country-filter', auth, controller.countryFiltration);

// get filter options
router.get('/country-filter/options', auth, controller.countryForFilter);

// get all country
router.get('/country', auth, controller.findAll);

//get country Options
router.get('/country/options', auth, controller.findAll);

// find by id
router.get('/country/:id', auth, controller.findById);

// update country status
router.put('/country/status/:id', auth, controller.updateStatus);

module.exports = router;
