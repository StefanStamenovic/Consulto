'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');
var mailer = require('../helpers/email-service');

var storage = models.Storage;

router.get('/test', function (req, res) {
    var synchro = require('../helpers/synchro');
    
});
module.exports = router;