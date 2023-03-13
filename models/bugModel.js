const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Musí obsahovat majitele reportu.'],
    },
    text: {
      type: String,
      maxlength: [200, 'Nahlášení chyby nesmí být delší než 200 charakterů'],
      required: [true, 'Musí obsahovat text reportu.'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
const Bug = mongoose.model('Bug', bugSchema);

module.exports = Bug;
