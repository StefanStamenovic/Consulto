'use strict';
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var models = require('../models');

var config = require('config');
var hash = config.get('config.hash');
var storage = models.Storage;

/* GET login page. */
router.get('/signup', function (req, res) {
    var vmodel = new models.viewmodels.Signup_vm();
    vmodel.title = "Signup";
    if (req.session.isLoged)
    {
        vmodel.isLoged = req.session.isLoged;
        res.redirect('/dashboard');
    }
    else
        vmodel.isLoged = false;
    res.render('./pages/signup', { model: vmodel });
});

module.exports = router;