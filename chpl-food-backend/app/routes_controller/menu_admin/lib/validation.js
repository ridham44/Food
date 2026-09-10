const { body, param } = require('express-validator');

exports.validationRules = () => [
  body('name').notEmpty().withMessage('Name is required'),
  body('url').notEmpty().withMessage('URL is required'),
  body('sequence').notEmpty().withMessage('Sequence is required').isInt().withMessage('Sequence must be an integer'),
  body('type').notEmpty().withMessage('Type is required'),
  body('key').notEmpty().withMessage('Key is required'),
  body('status').notEmpty().withMessage('Status is required').isIn(['0', '1']).withMessage('Status must be 0 or 1'),
];

exports.updateValidations = () => [
  param('id').notEmpty().withMessage('ID parameter is required'),
  body('name').optional().notEmpty().withMessage('Name is required'),
  body('url').optional().notEmpty().withMessage('URL is required'),
  body('sequence').optional().isInt().withMessage('Sequence must be an integer'),
  body('type').optional().notEmpty().withMessage('Type is required'),
  body('key').optional().notEmpty().withMessage('Key is required'),
  body('status').optional().isIn(['0', '1']).withMessage('Status must be 0 or 1'),
];
