const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const History = require('./../models/historyModel');
const Question = require('./../models/questionModel');
const { default: mongoose } = require('mongoose');

const formateArray = (allArray, usersArray, name) => {
  const newArray = allArray.map((el) => {
    const temp = usersArray.find((i) => i[name] === el._id);
    let count = 0;
    if (temp) count = temp.count;

    return {
      [name]: el._id,
      allCount: el.total,
      usersCount: count,
    };
  });
  return newArray;
};

exports.getResults = catchAsync(async (req, res, next) => {
  const questions = await Promise.all(
    req.body.map(async (q) => {
      const question = await Question.findById(q.question).lean();
      if (!question) return;
      question.answer = q.answer;
      return question;
    })
  );

  res.status(200).json({
    status: 'success',
    data: questions,
  });
});

exports.getOverview = catchAsync(async (req, res, next) => {
  const { allAreas, allTypes, allCount } = req.questions;
  const { types, correct, incorrect, notAnswered, uniqueQuestions, areas } =
    req.user.statistics;

  res.status(200).json({
    status: 'success',
    data: {
      correct,
      incorrect,
      notAnswered,
      types: formateArray(allTypes, types, 'type'),
      areas: formateArray(allAreas, areas, 'area'),
      allQuestions: allCount[0].total,
      usersAllQuestions: uniqueQuestions.length,
    },
  });
});

exports.getAreas = catchAsync(async (req, res, next) => {
  const { allAreas } = req.questions;
  const { areas } = req.user.statistics;
  res.status(200).json({
    status: 'success',
    data: {
      areas: formateArray(allAreas, areas, 'area'),
    },
  });
});

exports.getSelection = catchAsync(async (req, res, next) => {
  const { allAreas, allTypes, allCount } = req.questions;
  const { uniqueQuestions, areas, types } = req.user.statistics;
  res.status(200).json({
    status: 'success',
    data: {
      types: formateArray(allTypes, types, 'type'),
      areas: formateArray(allAreas, areas, 'area'),
      allCount: allCount[0].total,
      usersAllCount: uniqueQuestions.length,
    },
  });
});

exports.getHistory = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;

  const histories = await History.aggregate([
    { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $unwind: '$questions',
    },
    {
      $lookup: {
        from: 'questions', // name of the joined collection
        localField: 'questions.question',
        foreignField: '_id',
        as: 'questions.question',
      },
    },
    {
      $unwind: '$questions.question',
    },
    {
      $group: {
        _id: '$_id',
        correct: { $first: '$correct' },
        notAnswered: { $first: '$notAnswered' },
        incorrect: { $first: '$incorrect' },
        types: { $first: '$types' },
        areas: { $first: '$areas' },
        createdAt: { $first: '$createdAt' },
        user: { $first: '$user' },
        uniqueQuestions: { $first: '$uniqueQuestions' },
        questions: {
          $push: {
            question: '$questions.question',
            status: '$questions.status',
            answer: '$questions.answer',
            answerPos: '$questions.answerPos',
          },
        },
      },
    },
  ]);

  const count = await History.aggregate([
    { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
    { $count: 'count' },
  ]);

  res.status(200).json({
    status: 'success',
    count: count[0]?.count,
    data: histories,
  });
});

exports.getExamsPost = catchAsync(async (req, res, next) => {
  let questions = [];
  await Promise.all(
    req.body.map(async (q) => {
      const quest = await Question.findById(q.question);
      if (quest) questions.push(quest);
    })
  );
  console.log(questions);
  if (questions.length === 0) {
    return next(new AppError('Otázky už neexistují.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: questions,
  });
});

exports.getExams = catchAsync(async (req, res, next) => {
  let { areas, types, own, count, completed } = req.query;
  if (areas) {
    areas = areas.replaceAll('-', ' ').split(',');
  }
  if (types) {
    types = types.replaceAll('-', ' ').split(',');
  }

  count = count * 1 || 100;
  own = own * 1 === 0 ? false : true;
  completed = completed * 1 === 0 ? false : true;
  const checkId = req.user.statistics.uniqueQuestions.map((id) =>
    mongoose.Types.ObjectId(id)
  );

  const questions = await Question.aggregate([
    {
      $match: {
        $and: [
          // { _id: { $nin: checkId } },

          !areas
            ? {}
            : {
                area: {
                  $in: areas,
                },
              },
          !types
            ? {}
            : {
                type: {
                  $in: types,
                },
              },
          completed ? {} : { _id: { $nin: checkId } },
        ],
      },
    },
    {
      $sample: { size: count },
    },
  ]);
  res.status(200).json({
    status: 'success',
    questions: req.questions,
    data: questions,
  });
});

exports.saveExam = catchAsync(async (req, res, next) => {
  let correct = 0,
    incorrect = 0,
    notAnswered = 0;

  const areas = [],
    types = [];
  const questions = [];

  await Promise.all(
    req.body.map(async (q, index) => {
      const question = await Question.findById(q.question);
      if (question === null) next(new AppError('Otázka už neexistuje', 404)); // Otázka neexistuje error

      if (question.correct === q.answer) {
        correct++;
        q.status = 1;
      } else if (q.answer === -1) {
        notAnswered++;
        q.status = -1;
      } else {
        incorrect++;
        q.status = 0;
      }

      // Take types and areas of questions
      types.push(question.type);
      areas.push(question.area);

      // Create array of questions
      questions.push(q.question);
    })
  );

  const uniqueQuestions = Array.from(new Set(questions));
  const newAreas = Array.from(new Set(areas));
  const newTypes = Array.from(new Set(types));
  const newHistoryEntry = await History.create({
    correct,
    incorrect,
    notAnswered,
    areas: newAreas,
    types: newTypes,
    user: req.user.id,
    uniqueQuestions,
    questions: req.body,
  });
  getHistoryById(newHistoryEntry.id, res, 200);
});

exports.getHistoryById = catchAsync(async (req, res, next) => {
  getHistoryById(req.params.id, res, 200);
});

const getHistoryById = async (id, res, status) => {
  res.status(status).json({
    status: 'success',
    data: await History.findById(id).populate('questions.question'),
  });
};

exports.getProfile = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      name: req.user.name,
      email: req.user.email,
      dateOfBirth: req.user.dateOfBirth,
    },
  });
});

exports.getQuestions = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
  });
});
