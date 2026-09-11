const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { status } = require('../../utils/lib/messages/api.response');

// Shared, hardened image-upload config used by every "upload a photo" route
// (menu, tenant, user profile, country flag). Fixes three issues the
// per-route copies of this all shared:
//  1. The stored filename came straight from the client-supplied
//     `file.originalname` (only whitespace stripped, and even that was
//     broken by a regex typo in one copy) — an attacker-controlled name
//     containing `../` segments could escape the upload directory, and the
//     attacker fully controlled the stored file's extension.
//  2. `fileFilter` only checked `file.mimetype`, which is just the
//     client-supplied multipart Content-Type header — trivially spoofable,
//     so a `.html`/`.svg` could be uploaded with `Content-Type: image/png`
//     and would then be served back (from the public /uploads static mount,
//     with CSP disabled) as attacker-controlled, browser-executable content.
//  3. No extension check independent of the spoofable mimetype.
// Fix: ignore the client's filename entirely for storage — generate a
// random name server-side — and require both the mimetype AND the file's
// own extension to match an image allowlist.

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(null, true);
    }
    req.fileValidationError = true;
    return cb(new Error('File validation error'), false);
};

/**
 * @param {string} subdir - folder under ./uploads (e.g. 'menu', 'tenant')
 */
const createImageUpload = (subdir) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = `./uploads/${subdir}`;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            cb(null, `${Date.now()}_${crypto.randomBytes(16).toString('hex')}${ext}`);
        },
    });

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 },
    });
};

const removeUploadedFileOnError = (req) => {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    if (req.files) {
        Object.values(req.files)
            .flat()
            .forEach((f) => {
                if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
    }
};

const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        removeUploadedFileOnError(req);
        return res.status(status.InternalServerError).json({ message: 'File upload error!', error: err.message });
    }
    if (req.fileValidationError) {
        removeUploadedFileOnError(req);
        return res.status(status.BadRequest).json({ message: 'Only .png, .jpg, .jpeg, and .webp images are allowed!' });
    }
    if (err) {
        removeUploadedFileOnError(req);
        return res.status(status.InternalServerError).json({ message: 'Unexpected file upload error', error: err.message });
    }
    next();
};

module.exports = { createImageUpload, handleUploadErrors, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS };
