const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const Order = require('../models/orderModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.CheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get service depend on serviceId
  const service = await Service.findById(req.params.serviceId);

  if (!service) {
    return next(new AppError(`no service found for ${req.params.serviceId}`));
  }

  // 2) app settings
  const servicePrice = service.salary;
  const taxSalary = servicePrice * 0.15;

  const totalServicePrice = servicePrice + taxSalary;

  const unitAmount = Math.round(totalServicePrice * 100);

  // 3) create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'egp',
          unit_amount: unitAmount,
          product_data: {
            name: service.name,
            description: service.description,
          },
        },
      },
    ],
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/`,
    customer_email: req.user.email,
    client_reference_id: req.params.serviceId,
  });

  // 4) send session response
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createOrderCheckout = async (session) => {
  const serviceId = session.client_reference_id;
  const service = await Service.findById(serviceId);
  const user = await User.findOne({ email: session.customer_email });
  const salary = session.amount_total / 100;

  await Order.create({
    user: user._id,
    service,
    salary,
    isPaid: true,
    paidAt: Date.now(),
  });
};

exports.webhookCheckout = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    //  Create order
    createOrderCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

exports.getAllOrder = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.user.role === 'user') filter = { user: req.user.id };

  const documentsCounts = await Order.countDocuments();

  const features = new APIFeatures(Order.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;
  const order = await query;

  res.status(200).json({
    status: 'success',
    results: order.length,
    paginationResult,
    order,
  });
});

exports.getOneOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError(`No Order found for id: ${req.params.id}`), 404);
  }

  res.status(200).json({
    status: 'success',
    order,
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //to return new document
    runValidators: true,
  });

  if (!order) {
    return next(new AppError(`No Order found for id: ${req.params.id}`), 404);
  }

  res.status(200).json({
    status: 'success',
    order,
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new AppError(`No Order found for id: ${req.params.id}`), 404);
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
