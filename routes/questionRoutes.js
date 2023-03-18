const express = require('express');
const authController = require('./../controllers/authController');
const questionController = require('./../controllers/questionController');
const multer = require('multer');
const AppError = require('../utils/appError');

const router = express.Router({ mergeParams: true });

router.route('/exam/:url').get(questionController.getSelectedQuestions);

router.route('/exam').post(questionController.createQuestionsSelection);

router.use(authController.protect);
router.post(
  '/img',
  questionController.uploadUserPhoto,
  questionController.resizeUserPhoto,
  questionController.uploadImage
);

router
  .route('/')
  .get(questionController.getAllQuestions)
  .post(
    authController.restrictTo('admin'),
    questionController.addUser,
    questionController.createQuestion
  );

router.route('/statistics').get(questionController.getStatistics);

router
  .route('/:id')
  .get(questionController.getQuestion)
  .patch(
    authController.restrictTo('user', 'admin'),
    questionController.updateQuestion
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    questionController.deleteQuestion
  );

module.exports = router;
