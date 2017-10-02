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
        res.redirect('/dashbord');
    }
    else
        vmodel.isLoged = false;
    res.render('./pages/signup', { model: vmodel });
});

router.post('/signup', function (req, res) {
    var name = req.param('name');
    var email = req.param('email');
    var password = req.param('password');
    var user = req.param('user');
    var hmac = crypto.createHmac('sha512', hash);
    hmac.update(password);
    var hashPassword = hmac.digest('hex');
    if (user == "professor")
        models.dbmodels.Professor.create({ name: name, email: email, password: hashPassword });
    else if (user == "student")
        models.dbmodels.Student.create({ name: name, email: email, password: hashPassword });
    res.redirect('/');
});

module.exports = router;