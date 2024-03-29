const Comment = require('../models/commentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createComment = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;

  const newComment = await Comment.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      comment: newComment,
    },
  });
});

exports.getAllComments = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.postId) filter = { post: req.params.postId };
  const comments = await Comment.find(filter);
  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: {
      comments,
    },
  });
});

exports.getComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('No Comment found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      comment,
    },
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  let comment;
  comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('No Comment found with that ID', 404));
  }

  if (req.user.role !== 'admin' && req.user.id != comment.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this comment and admin.',
        401
      )
    );
  }

  await Comment.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      comment,
    },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  let comment;
  comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('No Comment found with that ID', 404));
  }

  if (req.user.role !== 'admin' && req.user.id != comment.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this comment and admin.',
        401
      )
    );
  }

  await Comment.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
