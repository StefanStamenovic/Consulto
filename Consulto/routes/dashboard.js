'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');

/* GET login page. */
router.get('/dashboard', function (req, res) {
    var vmodel = new models.viewmodels.Dashboard_vm();
    vmodel.title = "Dashboard";
    if (!req.session.isLoged) {
        res.redirect('/');
    }
    vmodel.isLoged = req.session.isLoged;
    vmodel.user = req.session.user;
    vmodel.user_type = req.session.user_type;
    var storage = new models.Storage();

    if (req.session.user_type == "professor") {
        storage.findProfessorSubjects(req.session.user, function (subjects) {
            vmodel.userSubjects = subjects;
            res.render('./pages/dashboard', { model: vmodel });
        });
    }
    else if (req.session.user_type == 'student') {
        storage.findAllSubjects(function (subjects) {
            vmodel.allSubjects = subjects;
            storage.findStudentSubjects(req.session.user, function (usubjects) {
                vmodel.userSubjects = usubjects;
                res.render('./pages/dashboard', { model: vmodel });
            });
        });
    }
    else
        res.redirect('/');
});

module.exports = router;