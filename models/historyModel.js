const mongoose = require('mongoose');
const User = require('./../models/userModel');
const Question = require('./../models/questionModel');

const historySchema = new mongoose.Schema(
  {
    correct: {
      type: Number,
      default: 0,
    },
    notAnswered: {
      type: Number,
      default: 0,
    },
    incorrect: {
      type: Number,
      default: 0,
    },
    types: [
      {
        type: String,
      },
    ],
    areas: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'Chybí majitel záznamu'],
      ref: 'User',
    },
    uniqueQuestions: [
      {
        type: mongoose.Schema.ObjectId,
        // ref: 'question',
      },
    ],
    questions: [
      {
        question: {
          type: mongoose.Schema.ObjectId,
          ref: 'Question',
        },
        status: Number,
        answer: Number,
        answerPos: Array,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

historySchema.statics.addData = async function (historyId) {
  // Get data of the historyObject
  let data = await this.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(historyId) },
    },
    {
      $project: {
        id: '$user',
        correct: '$correct',
        incorrect: '$incorrect',
        notAnswered: '$notAnswered',
        types: '$types',
        areas: '$areas',
        uniqueQuestions: '$uniqueQuestions',
      },
    },
  ]);
  data = data[0];
  // Get uniqueQuestions which are not in user's database
  let userData = await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(data.id) },
    },
    {
      $project: {
        unique: {
          $setDifference: [data.uniqueQuestions, '$statistics.uniqueQuestions'],
        },
        areas: '$statistics.areas',
        types: '$statistics.types',
      },
    },
  ]);

  // Aggregation return array, so make it as object
  userData = userData[0];
  data.uniqueQuestions = userData.unique;
  data.areas = userData.areas;
  data.types = userData.types;

  // Get questions areas and types
  let areas = [],
    types = [];

  await Promise.all(
    data.uniqueQuestions.map(async (id) => {
      const question = await Question.findById(id);
      areas.push(question.area);
      types.push(question.type);
    })
  );

  // Update areas
  areas.forEach((area) => {
    const existingArea = data.areas.find((a) => a.area === area);

    if (existingArea) {
      existingArea.count++;
    } else {
      data.areas.push({
        area: area,
        count: 1,
      });
    }
  });

  // Update types
  types.forEach((type) => {
    const existingType = data.types.find((t) => t.type === type);

    if (existingType) {
      existingType.count++;
    } else {
      data.types.push({
        type: type,
        count: 1,
      });
    }
  });
  // Update users statistics
  await User.updateOne(
    { _id: mongoose.Types.ObjectId(data.id) },
    {
      $addToSet: {
        'statistics.uniqueQuestions': { $each: data.uniqueQuestions },
      },
      $inc: {
        'statistics.correct': data.correct,
        'statistics.incorrect': data.incorrect,
        'statistics.notAnswered': data.notAnswered,
      },
      $set: {
        'statistics.areas': data.areas,
        'statistics.types': data.types,
      },
    }
  );
};
historySchema.post('save', async function () {
  this.constructor.addData(this.id);
});

const History = mongoose.model('History', historySchema);

module.exports = History;
