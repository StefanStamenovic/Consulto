'use strict';
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var models = require('../models');

var config = require('config');
var hash = config.get('config.hash');

/* GET login page. */
router.get('/login', function (req, res) {
    var vmodel = new models.viewmodels.Login_vm();
    vmodel.title = "Login";
    if (req.session.isLoged)
    {
        vmodel.isLoged = req.session.isLoged;
        res.redirect('/dashboard');
    }
    else
        vmodel.isLoged = false;
    res.render('./pages/login', { model: vmodel});
});

router.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var hmac = crypto.createHmac('sha512', hash);
    hmac.update(password);
    var hashPassword = hmac.digest('hex');
    var storage = new models.Storage();

    storage.findUserByEmail(email, function (user, user_type) {
        if (user != null && user.password == hashPassword) {
            req.session.isLoged = true;
            req.session.user_type = user_type;
            req.session.user = user;
            user.update({ status: true }).then(() => {
                res.redirect('/dashboard');
            });
        }
        else
            res.redirect('/login');
    });
});

router.get('/logout', function (req, res) {
    req.session.isLoged = false;
    var storage = new models.Storage();

    storage.findUserByEmail(req.session.user.email, function (user, user_type) {
        if (user != null)
            user.update({ status: false }).then(() => {
                res.redirect('/');
            });
    });

    req.session.user_type = undefined;
    req.session.user = undefined;
});

module.exports = router;