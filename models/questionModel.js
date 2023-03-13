const mongoose = require('mongoose');
// const validator = require('validator');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Otázka musí obsahovat otázku!'],
    },
    answers: {
      type: Array,
      validate: {
        validator: function (el) {
          return el.length >= 1 && el.length <= 4;
        },
        message: 'Otáky mají špatný počet',
      },
    },
    explanation: {
      type: String,
      required: [true, 'Otázka musí obsahovat vysvětlení!'],
    },
    correct: {
      type: Number,
      required: [true, 'Otázka musí obsahovat číslo správné odpovědi!'],
    },
    img: String,
    audio: String,
    type: {
      type: String,
      required: [true, 'Musí být zadaný typ otázky!'],
      // enum: ['možnosti', 'poslech', 'obrázek'],
    },
    area: {
      type: String,
      required: [true, 'Musí být zadaná oblast otázky!'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    public: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

questionSchema.pre('save', async function (next) {
  const answers = this.answers.map((a, index) => {
    return {
      id: index,
      answer: a,
    };
  });
  this.answers = answers;

  next();
});

const Question =
  mongoose.model.Question || mongoose.model('Question', questionSchema);

module.exports = Question;
