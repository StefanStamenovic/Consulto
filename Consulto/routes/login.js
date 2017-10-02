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
        res.redirect('/dashbord');
    }
    else
        vmodel.isLoged = false;
    res.render('./pages/login', { model: vmodel});
});

router.post('/login', function (req, res) {
    var email = req.param('email');
    var password = req.param('password');
    var hmac = crypto.createHmac('sha512', hash);
    hmac.update(password);
    var hashPassword = hmac.digest('hex');
    models.dbmodels.Professor.findOne({ where: { email: email } }).then(professor => {
        if (professor.password == hashPassword)
            req.session.isLoged = true;
        res.redirect('/');
    });
    
});

router.get('/logout', function (req, res) {
    req.session.isLoged = false;
    res.redirect('/');
});

module.exports = router;