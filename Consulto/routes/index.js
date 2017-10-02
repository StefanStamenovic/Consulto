'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');
/* GET home page. */
router.get('/', function (req, res) {
    var vmodel = new models.viewmodels.Index_vm();
    vmodel.title = "Consulto";
    if (req.session.isLoged)
        vmodel.isLoged = req.session.isLoged;
    else
        vmodel.isLoged = false;

    res.render('index', { model: vmodel });
});

module.exports = router;
