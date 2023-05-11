const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'task must have a name'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'task must have description'],
    },
    delieveryDate: {
      type: String,
      required: [true, 'task must have delivery Date'],
    },
    softwareTool: {
      type: [String],
      required: [true, 'task must have tools'],
    },
    catogery: {
      type: String,
      enum: {
        values: [
          'Web Design',
          'Business',
          'Marketing',
          'Software Engineering',
          'Web Developer',
          'App Developer',
          'Product Manager',
          'Accountant',
          'Ui/Ux Design',
          'Graphics Designer',
        ],
        message:
          'catogery is either: Web Design, Marketing, Business ,Software Engineering , Web Developer, App Developer ,Product Manager , Accountant,Ui/Ux Design , Graphics Designer',
      },
      required: [true, 'task must have catogery'],
    },
    salary: {
      type: Number,
      required: [true, 'task must have salary '],
      validate: {
        validator: function (val) {
          //this only points to current doc on New document creation
          if (this.catogery === 'Web Design' || 'Ui/Ux Design') {
            return val >= 50 && val <= 70;
          } else if (this.catogery === 'Graphics Designer' || 'Marketing') {
            return val >= 70 && val <= 90;
          } else if (this.catogery === 'Business' || 'Accountant') {
            return val >= 90 && val <= 110;
          } else if (this.catogery === 'Web Developer' || 'App Developer') {
            return val >= 110 && val <= 130;
          } else {
            this.catogery === 'Product Manager' || 'Software Engineering';
            return val >= 130 && val <= 150;
          }
        },
        message: 'the salary of this task have a specific range',
      },
    },
    saved: {
      type: Array,
      default: [],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'post Must Belong To User'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.index({ salary: -1, delieveryDate: -1 }); //desecending order

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo ratingsAverage isOnline ratingsQuantity',
  });
  next();
});

postSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id',
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
