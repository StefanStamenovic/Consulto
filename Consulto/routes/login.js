'use strict';
var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/login', function (req, res) {
    res.render('./pages/login', { title: "Consulto", count: req.session.count++ });
});

module.exports = router;