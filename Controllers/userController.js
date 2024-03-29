const User = require('../models/userModel');
const Post = require('../models/postModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const uploadImageMiddleware = require('../middlewares/uploadImageMiddleware');
const uploadPdfMiddleware = require('../middlewares/uploadPdfMiddlewares');

exports.alisTopUser = (req, res, next) => {
  (req.query.limit = '4'),
    (req.query.sort = '-ratingsAverage'),
    (req.query.fields = 'name,ratingsAverage,photo,skills,ratingsQuantity,job');
  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
// UPLOAD PHOTO FOR PORTFOLIO
exports.uploadUserPortfolio = uploadImageMiddleware.uploadMixOfImages([
  { name: 'images', maxCount: 6 },
]);

exports.resizePortfolioImages = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.images) {
    return next();
  }
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const result = await uploadImageMiddleware.uploadToCloudinary(file);

      req.body.images.push(result.secure_url);
    })
  );
  next();
});

exports.UserPortfolio = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword',
        400
      )
    );
  }
  // 2) Update user document
  const data = await User.findByIdAndUpdate(
    req.user.id,
    { images: req.body.images },
    {
      new: true, // to return new document
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'Success',
    data: {
      data,
    },
  });
});

// UPLOAD USER PHOTO
exports.uploadUserPhoto = uploadImageMiddleware.uploadSingleImage('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadImageMiddleware.uploadToCloudinary(req.file);

    req.body.photo = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
});

exports.userPhoto = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword',
        400
      )
    );
  }
  // 2) Update user document
  const data = await User.findByIdAndUpdate(
    req.user.id,
    { photo: req.body.photo },
    {
      new: true, // to return new document
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'Success',
    data: {
      data,
    },
  });
});

exports.uploadUserFile = uploadPdfMiddleware.uploadPdf('cv');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.uploadUserCV = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword.',
        400
      )
    );
  }
  // 2) Filtered
  const filteredBody = filterObj(req.body);
  if (req.file) filteredBody.cv = req.fileUrl;
  // 3) Update user document
  const data = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      data,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword.',
        400
      )
    );
  }
  // 2) Update user document
  const data = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // to return new document
    runValidators: true,
  });

  if (!data) {
    return next(new AppError('No User Found With That Id', 404));
  }

  res.status(200).json({
    status: 'Success',
    data: {
      data,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('reviews');

  if (!user) {
    return next(new AppError('No User Found With That Id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUser = catchAsync(async (req, res, next) => {
  const documentsCounts = await User.countDocuments();
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;

  const users = await query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    paginationResult,
    data: {
      users,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No User Found With That Id', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// follow user
exports.followUser = catchAsync(async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!user.followers.includes(req.user.id)) {
      await user.updateOne({ $push: { followers: req.user.id } });
      await currentUser.updateOne({ $push: { followings: req.params.id } });

      res.status(200).json({
        status: 'success',
        message: 'user has been followed',
      });
    } else {
      return next(new AppError('You Already Follow This User', 404));
    }
  } else {
    return next(new AppError('You Can Not Follow Yourself', 404));
  }
});

//unfollow user
exports.unFollowUser = catchAsync(async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (user.followers.includes(req.user.id)) {
      await user.updateOne({ $pull: { followers: req.user.id } });
      await currentUser.updateOne({ $pull: { followings: req.params.id } });

      res.status(200).json({
        status: 'success',
        message: 'user has been unfollowed',
      });
    } else {
      return next(new AppError('You Can Not Follow This User', 404));
    }
  } else {
    return next(new AppError('You Can Not Unfollow Yourself', 404));
  }
});

//timeline posts
exports.timeline = catchAsync(async (req, res, next) => {
  if (!req.params.id) req.params.id = req.user.id;
  const currentUser = await User.findById(req.params.id);
  const userPosts = await Post.find({ user: currentUser._id });
  const friendPosts = await Promise.all(
    currentUser.followings.map((friendId) => {
      return Post.find({ user: friendId });
    })
  );

  res.status(200).json(userPosts.concat(...friendPosts));
});

//search users
exports.searchUser = catchAsync(async (req, res, next) => {
  const search = req.params.search;
  const users = await User.find({
    $or: [
      { name: { $regex: '.*' + search + '.*' } },
      { job: { $regex: '.*' + search + '.*' } },
    ],
  });
  if (users.length > 0) {
    res.status(200).json({
      status: 'success',
      message: 'users datails',
      results: users.length,
      users,
    });
  } else {
    res.status(200).json({
      status: 'success',
      message: 'users not found!',
    });
  }
});

//related post
exports.relatedPosts = catchAsync(async (req, res, next) => {
  if (!req.params.id) req.params.id = req.user.id;
  const documentsCounts = await User.countDocuments();
  const currentUser = await User.findById(req.params.id);
  //EXCUTE QUERY
  const features = new APIFeatures(
    Post.find({ catogery: currentUser.catogery }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;
  const posts = await query;

  res.status(200).json({
    status: 'success',
    paginationResult,
    results: posts.length,
    data: {
      posts,
    },
  });
});
