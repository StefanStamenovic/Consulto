'use strict';
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var models = require('../models');

var config = require('config');
var hash = config.get('config.hash');

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

router.post('/signup', function (req, res) {
    //Parametri
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var user_type = req.body.user;
    var index = req.body.index;
    var year = req.body.year;

    //Hesiranje sifre
    var hmac = crypto.createHmac('sha512', hash);
    hmac.update(password);
    var hashPassword = hmac.digest('hex');

    var storage = new models.Storage();
    storage.createUser(user_type, name, email, hashPassword, index, year);
    res.redirect('/');
});

module.exports = router;