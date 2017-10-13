'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');

/* GET login page. */
router.get('/test', function (req, res) {
    var storage = new models.Storage();
    //storage.createUser('professor', 'Stefan Stamenovic', 'stefan.stamenovic@gmail.com', 12, 2, 4);
    /*storage.findUserByEmail("stefan.stamenovic@gmail.com", function (user, type) {
        if (user != null)
            storage.createSubject(user, "Baze podataka", 4);
    });*/
    storage.test(function () {
    });
});
module.exports = router;