const express = require('express');
const authController = require('./../controllers/authController');
const historyController = require('./../controllers/historyController');
const questionController = require('./../controllers/questionController');
const pageController = require('./../controllers/pageController');

const router = express.Router({ mergeParams: true });

router.route('/results').post(pageController.getResults);

router.use(authController.protect);
router
  .route('/overview')
  .get(questionController.getStatistics, pageController.getOverview);

router
  .route('/areas')
  .get(questionController.getStatistics, pageController.getAreas);
router
  .route('/selection')
  .get(questionController.getStatistics, pageController.getSelection);
router
  .route('/history')
  .get(questionController.getStatistics, pageController.getHistory);
router
  .route('/history/:id')
  .get(questionController.getStatistics, pageController.getHistoryById);

router
  .route('/questions')
  .get(questionController.getStatistics, pageController.getExams);

router
  .route('/exam')
  .post(pageController.getExamsPost)
  .get(pageController.getExams);

router.post('/examSave', pageController.saveExam);

router.route('/profile').get(pageController.getProfile);

// router
//   .route('/:id')
//   .get(bugController.getBug)
//   .patch(authController.restrictTo('user', 'admin'), bugController.updateBug)
//   .delete(authController.restrictTo('user', 'admin'), bugController.deleteBug);

module.exports = router;
