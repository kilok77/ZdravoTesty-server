const History = require('./../models/historyModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.addUser = factory.addUserToBody(History);

exports.getAllHistories = factory.getAll(History);
exports.getHistory = factory.getOne(History);

exports.getUsersHistoryStatistics = catchAsync(async (req, res, next) => {
  const data = await History.aggregate([
    { $match: { user: ObjectId(req.user.id) } },
    {
      $facet: {
        types: [
          { $unwind: '$types' },
          { $group: { _id: '$types', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        areas: [
          { $unwind: '$areas' },
          { $group: { _id: '$areas', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        data: [
          {
            $group: {
              _id: null,
              correct: { $sum: '$correct' },
              incorrect: { $sum: '$incorrect' },
              notAnswered: { $sum: '$notAnswered' },
            },
          },
        ],
      },
    },
  ]);

  req.history = data[0];
  next();
  // res.status(200).json({
  //   status: 'success',
  //   data,
  // });
});

exports.createHistory = factory.createOne(History);

exports.deleteHistory = factory.deleteOne(History);
exports.updateHistory = factory.updateOne(History);
