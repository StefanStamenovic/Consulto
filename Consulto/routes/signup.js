'use strict';
var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/signup', function (req, res) {
    res.render('./pages/signup', { title: "Consulto", count: req.session.count++ });
});

module.exports = router;