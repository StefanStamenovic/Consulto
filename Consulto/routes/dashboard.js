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

            //Pronalazim sve zahtve za predmete
            var promises = [];
            //Nalzim zahteve ako postoje za svaki od predmeta
            vmodel.userSubjects.forEach(subject => {
                promises.push(new Promise((resolve, reject) => {
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

                var promises = [];
                //Nalzim zahteve ako postoje za svaki od predmeta
                vmodel.userSubjects.forEach(subject => {
                    promises.push(new Promise((resolve, reject) => {
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
                        res.render('./pages/dashboard', { model: vmodel });
                    });
                });
            });
        });
    }
    else
        res.redirect('/');
});

module.exports = router;