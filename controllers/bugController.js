const Bug = require('./../models/bugModel');
// const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.addUser = factory.addUserToBody(Bug);

exports.getAllBugs = factory.getAll(Bug);
exports.getBug = factory.getOne(Bug);

exports.createBug = factory.createOne(Bug);

exports.deleteBug = factory.deleteOne(Bug);
exports.updateBug = factory.updateOne(Bug);
