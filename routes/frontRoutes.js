const express = require('express');
const authFront = require('../Auth/authFornt');

const router = express.Router();

router.post('/register', authFront.signup);

module.exports = router;
