const express = require('express');
const authController = require('./../controllers/authController');
const bugController = require('./../controllers/bugController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(bugController.getAllBugs)
  .post(
    authController.restrictTo('user', 'admin'),
    bugController.addUser,
    bugController.createBug
  );

router
  .route('/:id')
  .get(bugController.getBug)
  .patch(authController.restrictTo('user', 'admin'), bugController.updateBug)
  .delete(authController.restrictTo('user', 'admin'), bugController.deleteBug);

module.exports = router;
