'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');

var routes = [];

//Ruta za krejiranje predmeta od strane profesora
routes.push(router.post('/subject/create', function (req, res) {
    var name = req.body.name;
    var year = req.body.year;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type != 'professor') {
        res.redirect('/error');
    }
    storage.createSubject(req.session.user, name, year, function () {
        res.redirect('/dashboard')
    });
}));

//Ruta za selektovanje predmeta od strane studenta
routes.push(router.post('/subject/select', function (req, res) {
    var subject = req.body.subject;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type != 'student') {
        res.redirect('/error');
    }
    storage.selectSubjectForStudent(req.session.user, subject, function () {
        res.redirect('/dashboard')
    });
}));

module.exports = routes;