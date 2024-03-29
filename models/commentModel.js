const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post',
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.pre(/^find/, function (next) {
  //this => query
  this.populate({
    path: 'user',
    select: 'name photo ratingsAverage isOnline',
  });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
