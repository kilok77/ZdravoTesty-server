const Question = require('./../models/questionModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');

exports.addUser = factory.addUserToBody(Question);

exports.getAllQuestions = factory.getAll(Question);
exports.getQuestion = factory.getOne(Question);

exports.createQuestion = factory.createOne(Question);

exports.deleteQuestion = factory.deleteOne(Question);
exports.updateQuestion = factory.updateOne(Question);

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/img');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `question-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `question-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`uploads/img/${req.file.filename}`); // the file is in the memory

  next();
};

exports.createQuestion = catchAsync(async (req, res, next) => {
  const doc = await Question.create({
    question: req.body.question,
    answers: req.body.answers,
    explanation: req.body.explanation,
    correct: req.body.correct,
    area: req.body.area,
    type: req.body.type,
    user: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.uploadImage = catchAsync(async (req, res, next) => {
  res.status(201).json({
    status: 'success',
  });
});

exports.getSelectedQuestions = catchAsync(async (req, res, next) => {
  const encodedUrl = req.params.url;
  const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');
  const groupIds = url.split('/').pop().split('-');
  const questions = [];
  await Promise.all(
    groupIds.map(async (q) => {
      const question = await Question.findById(q);
      if (question) questions.push(question);
    })
  );
  res.status(200).json({
    status: 'success',
    data: questions,
  });
});

exports.createQuestionsSelection = catchAsync(async (req, res, next) => {
  const ids = req.body.questions;

  const idsUrl = `${ids.join('-')}`;
  const encodedUrl = Buffer.from(idsUrl).toString('base64');
  res.status(200).json({
    status: 'success',
    idsUrl,
    encodedUrl,
  });
});

exports.getStatistics = catchAsync(async (req, res, next) => {
  const data = await Question.aggregate([
    {
      $facet: {
        allAreas: [
          { $group: { _id: '$area', total: { $sum: 1 } } },
          { $sort: { total: -1, _id: 1 } },
        ],
        allTypes: [
          { $group: { _id: '$type', total: { $sum: 1 } } },
          { $sort: { total: -1, _id: 1 } },
        ],
        allCount: [
          {
            $count: 'total',
          },
        ],
      },
    },
  ]);

  req.questions = data[0];
  next();
  // res.status(200).json({
  //   status: 'success',
  //   data,
  // });
});
