const { body } = require('express-validator');

const validateMenuRatings = () => {
  return [
    body('orderId')
      .notEmpty()
      .withMessage('Order ID is required')
      .isUUID()
      .withMessage('Order ID must be a valid UUID'),

    body('reviews')
      .isArray({ min: 1 })
      .withMessage('Reviews must be a non-empty array'),

    body('reviews.*.menuId')
      .notEmpty()
      .withMessage('menuId is required')
      .isUUID()
      .withMessage('menuId must be a valid UUID'),

    body('reviews.*.comboItemMenuId')
      .optional()
      .isUUID()
      .withMessage('comboItemMenuId must be a valid UUID'),

    body('reviews.*.rating')
      .notEmpty()
      .withMessage('Rating is required')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),

    body('reviews.*.review')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Review must be a string with a max length of 500 characters'),
  ];
};

module.exports = validateMenuRatings;
