const express = require('express');
const authController = require('../Controllers/authController');
const serviceController = require('../Controllers/serviceController');

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('user'),
    serviceController.uploadFile,
    serviceController.resizeAttachFile,
    serviceController.createService
  )
  .get(serviceController.getAllService);

router
  .route('/:id')
  .get(serviceController.getService)
  .patch(
    authController.restrictTo('user'),
    serviceController.uploadFile,
    serviceController.resizeAttachFile,
    serviceController.updateService
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    serviceController.deleteService
  );

router.route('/:search/search-service').get(serviceController.searchService);

module.exports = router;
