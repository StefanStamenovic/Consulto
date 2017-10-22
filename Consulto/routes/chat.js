'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');
var config = require('config');
var key = config.get('config.key');

/* GET login page. */
router.all('/chat', function (req, res) {
    var consult = req.body.consult;
    if (!req.session.isLoged)
        return res.render('/error', {message: 'Nemate pravo pristupa ovoj stranici.'});

    var vmodel = new models.viewmodels.Chat_vm();
    vmodel.title = "Chat";
    var storage = new models.Storage();
    try {
        storage.findConsultById(consult, consult => {
            if (consult == null)
                return res.render('./error', { message: 'Konsultacija nije pronadjena.' });

            var date = new Date() + new Date().getTimezoneOffset() * 60000;
            if (consult.sc_time > date)
                return res.render('./error', { message: 'Konsultacija jos nije trebalo da pocne.' });

            storage.findConsultProfessor(consult, professor => {
                storage.findConsultSubject(consult, subject => {
                    storage.findConsultStudents(consult, students => {
                        vmodel.consult = consult;
                        vmodel.subject = subject;
                        vmodel.professor = professor;
                        vmodel.students = students;

                        vmodel.isLoged = req.session.isLoged;
                        vmodel.user = req.session.user;
                        vmodel.user_type = req.session.user_type;

                        var cipher = crypto.createCipher('aes256', key);
                        var consultHash = cipher.update(consult.id.toString(), 'utf8', 'hex');
                        consultHash += cipher.final('hex');
                        vmodel.consultHash = consultHash;

                        cipher = crypto.createCipher('aes256', key);
                        var userHash = cipher.update(req.session.user.id.toString(), 'utf8', 'hex');
                        userHash += cipher.final('hex');
                        vmodel.userHash = userHash;

                        res.render('./pages/chat', { model: vmodel });
                    });
                });
            });
        });
    } catch (err) {
        return res.render('./error', { message: 'Greska prilikom pribavljanja podataka.' });
    }
});

module.exports = router;