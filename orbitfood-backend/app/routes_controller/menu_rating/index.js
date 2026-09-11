const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const validateMenuRatings = require('./lib/validation');

//Rating
router.post('/menu-rating', auth, validateMenuRatings(), expressValidate, controller.submitMenuReview);

//Rating report
router.post('/menu-rating/report', auth, controller.menuRatingReport);

//Report by specific menu
router.get('/menu-rating/report/:menuId', auth, controller.menuReviewDetails);

//Report by combo
router.get('/menu-rating/report-combo', auth, controller.comboMenuReport);

//by customer — scoped to the caller's own id (see controller)
router.get('/menu-rating/my-reviews', auth, controller.getCustomerReviewHistory);

//count by menu
router.get('/menu-rating/count/:menuId', auth, controller.getRatingDistribution);

module.exports = router;
