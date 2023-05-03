const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'order must belong to user'],
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'order must belong to service '],
    },
    salary: {
      type: Number,
      require: [true, 'order must have a salary'],
    },
    taxSalary: {
      type: Number,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email phoneNumber location photo',
  }).populate({
    path: 'service',
    select: 'user name delieveryDate salary',
  });
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
