'use strict';
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: "Consulto", count: req.session.count++ });
});

module.exports = router;
