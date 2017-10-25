'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');
var schedule = require('../helpers/schedule');
var mailer = require('../helpers/email-service');

var storage = models.Storage;

router.get('/test', function (req, res) {

});
module.exports = router;