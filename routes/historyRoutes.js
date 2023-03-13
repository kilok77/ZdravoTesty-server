const express = require('express');
const authController = require('./../controllers/authController');
const historyController = require('./../controllers/historyController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(historyController.getAllHistories)
  .post(
    authController.restrictTo('user', 'admin'),
    historyController.addUser,
    historyController.createHistory
  );

router
  .route('/usersHistoryStatistics')
  .get(historyController.getUsersHistoryStatistics);

router
  .route('/:id')
  .get(historyController.getHistory)
  .patch(
    authController.restrictTo('user', 'admin'),
    historyController.updateHistory
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    historyController.deleteHistory
  );

module.exports = router;
