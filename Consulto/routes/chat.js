'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');

/* GET login page. */
router.get('/chat', function (req, res) {
    var vmodel = new models.viewmodels.Chat_vm();
    vmodel.title = "Chat";
    if (!req.session.isLoged) {
        res.redirect('/');
    }
    vmodel.isLoged = req.session.isLoged;
    vmodel.user = req.session.user;
    vmodel.ident = req.session.ident;
    res.render('./pages/chat', { model: vmodel });
});

module.exports = router;