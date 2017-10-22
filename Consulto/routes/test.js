'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');

/* GET login page. */
router.get('/test', function (req, res) {
    var storage = new models.Storage();

    /*storage.findUserByEmail('aleksandar.stanimirovic@elfak.rs', function (user, type) {
        res.set({ 'Content-Type': 'application/json; charset=utf-8' }).send(200, JSON.stringify(user, undefined, ' '));
    });*/

    /*storage.createUser("professor", 'Test', 'test@elfak.rs', 'test', 14906, 3, function (user) {
        res.set({ 'Content-Type': 'application/json; charset=utf-8' }).send(200, JSON.stringify(user, undefined, ' '));
    });*/

    /*.createSubject({ id: 8}, "Test", 8, function (subject) {
        res.set({ 'Content-Type': 'application/json; charset=utf-8' }).send(200, JSON.stringify(subject, undefined, ' '));
    });*/

    /*storage.selectSubjectForStudent({ id: 2 }, 3, () => {

    });*/
    /*storage.findProfessorSubjects({ id: 1 }, subjects => {
        res.set({ 'Content-Type': 'application/json; charset=utf-8' }).send(200, JSON.stringify(subjects, undefined, ' '));
    });*/
    /*
    storage.findStudentConsultRequest({ id: 1 }, 6, consult => {
        res.set({ 'Content-Type': 'application/json; charset=utf-8' }).send(200, JSON.stringify(consult, undefined, ' '));
    });*/
});
module.exports = router;