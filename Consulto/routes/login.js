'use strict';
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var models = require('../models');

var config = require('config');
var hash = config.get('config.hash');
var storage = models.Storage;

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

router.get('/logout', function (req, res) {
    if (!req.session.isLoged)
        return res.redirect('/');
    req.session.isLoged = undefined;
    req.session.user_type = undefined;
    storage.findUserByEmail(req.session.user.email, function (user, user_type) {
        if (user != null)
            user.update({ status: false }).then(() => {
                res.redirect('/');
            });
    });
    req.session.user = undefined;
});

module.exports = router;