'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');
var config = require('config');
var key = config.get('config.key');
var storage = models.Storage;

router.get('/dashboard', function (req, res) {
    if (!req.session.isLoged) {
        return res.render('./error', { message: 'Nemate pravo pristupa ovoj stranici.' });
    }

    var vmodel = new models.viewmodels.Dashboard_vm();
    vmodel.title = "Dashboard";

    try {
        if (req.session.user_type == "professor") {
            storage.findProfessorSubjects(req.session.user, function (subjects) {
                vmodel.userSubjects = subjects;
                vmodel.userSubjectsIds = [];

                //Pronalazim sve zahtve za predmete
                var promises = [];
                //Nalzim zahteve ako postoje za svaki od predmeta
                vmodel.userSubjects.forEach(subject => {
                    promises.push(new Promise((resolve, reject) => {
                        vmodel.userSubjectsIds.push(subject.id);
                        storage.findSubjectConsultRequests(subject, request => {
                            subject.request = request;
                            resolve(request);
                        });
                    }));
                });
                Promise.all(promises).then(requests => {
                    promises = [];
                    vmodel.userSubjects.forEach(subject => {
                        promises.push(new Promise((resolve, reject) => {
                            storage.findSubjectConsults(subject, consults => {
                                subject.consults = consults;
                                resolve(consults);
                            });
                        }));
                    });
                    Promise.all(promises).then(consults => {
                        vmodel.isLoged = req.session.isLoged;
                        vmodel.user = req.session.user;
                        vmodel.user_type = req.session.user_type;

                        var cipher = crypto.createCipher('aes256', key);
                        var userHash = cipher.update(req.session.user.id.toString(), 'utf8', 'hex');
                        userHash += cipher.final('hex');
                        vmodel.userHash = userHash;

                        res.render('./pages/dashboard', { model: vmodel });
                    });
                });
            });
        }
        else if (req.session.user_type == 'student') {

            //Pronalazim sve predmete za potrebe izbora novog predmeta 
            storage.findAllSubjects(function (allsubjects) {
                vmodel.allSubjects = allsubjects;

                //Pronalazim sve predmete kojima student prisustvuje
                storage.findStudentSubjects(req.session.user, function (subjects) {
                    vmodel.userSubjects = subjects;
                    vmodel.userSubjectsIds = [];

                    var promises = [];
                    //Nalzim zahteve ako postoje za svaki od predmeta
                    vmodel.userSubjects.forEach(subject => {
                        promises.push(new Promise((resolve, reject) => {
                            vmodel.userSubjectsIds.push(subject.id);
                            storage.findStudentConsultRequest(req.session.user, subject.id, request => {
                                subject.request = request;
                                resolve(request);
                            });
                        }));
                    });
                    Promise.all(promises).then(requests => {
                        promises = [];
                        vmodel.userSubjects.forEach(subject => {
                            promises.push(new Promise((resolve, reject) => {
                                storage.findSubjectConsults(subject, consults => {
                                    subject.consults = consults;
                                    resolve(consults);
                                });
                            }));
                        });
                        Promise.all(promises).then(consults => {
                            vmodel.isLoged = req.session.isLoged;
                            vmodel.user = req.session.user;
                            vmodel.user_type = req.session.user_type;

                            var cipher = crypto.createCipher('aes256', key);
                            var userHash = cipher.update(req.session.user.id.toString(), 'utf8', 'hex');
                            userHash += cipher.final('hex');
                            vmodel.userHash = userHash;
                            res.render('./pages/dashboard', { model: vmodel });
                        });
                    });
                });
            });
        }
        else
            res.redirect('/');
    } catch (err) {
        return res.render('./error', { message: 'Greska prilikom pribavljanja podataka.' });
    }
});

module.exports = router;