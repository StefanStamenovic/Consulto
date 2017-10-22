'use strict';
var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');
var config = require('config');
var hash = config.get('config.hash');
var key = config.get('config.key');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var storage = new models.Storage();

var routes = [];
/*
|--------------------------------------------------------------------------
| SIGN AND LOG RUTE
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| DASHBOARD RUTE
|--------------------------------------------------------------------------
*/
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

//Ruta za odjavu predmeta od strane studenta
routes.push(router.post('/subject/deselect', function (req, res) {
    var subject = req.body.subject;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type != 'student') {
        res.redirect('/error');
    }
    storage.deselectSubjectForStudent(req.session.user, subject, function () {
        res.redirect('/dashboard')
    });
}));

//Promena statusa predmeta na aktivan od strane profesora
routes.push(router.post('/subject/active', function (req, res) {
    var subject = req.body.subject;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type == 'student') {
        res.redirect('/error');
    }
    storage.subjectOn(subject, function () {
        res.redirect('/dashboard')
    });
}));

//Promena statusa predmeta na ugasen od strane profesora
routes.push(router.post('/subject/deactive', function (req, res) {
    var subject = req.body.subject;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type == 'student') {
        res.redirect('/error');
    }
    storage.subjectOff(subject, function () {
        res.redirect('/dashboard')
    });
}));

//Ruta za slanje zahteva za konsultaciju
routes.push(router.post('/subject/request', function (req, res) {
    var subject = req.body.subject;
    var req_subject = req.body.req_subject;
    var day = req.body.day;
    var month = req.body.month;
    var year = req.body.year;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type != 'student') {
        res.redirect('/error');
    }
    storage.requestConsult(req.session.user, subject, req_subject, new Date(year, month, day, 0, 0, 0, 0), function () {
        res.redirect('/dashboard');
    });
}));

//Ruta za brisanjezahteva
routes.push(router.post('/request/delete', function (req, res) {
    var student = req.body.student;
    var subject = req.body.subject;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type != 'student') {
        res.redirect('/error');
    }
    storage.deleteConsultRequest(student, subject, function () {
        res.redirect('/dashboard');
    });
}));

//Ruta za krejiranje nezahtevane konsultacije
routes.push(router.post('/consult/createsingle', function (req, res) {
    var subject = req.body.subject;
    var cons_subject = req.body.cons_subject;
    var day = req.body.day;
    var month = req.body.month;
    var year = req.body.year;
    var hour = req.body.hour;
    var minute = req.body.minute;
    var storage = new models.Storage();
    if (!req.session.isLoged || req.session.user_type == 'student') {
        res.redirect('/error');
    }
    storage.createConsult(subject, cons_subject, new Date(year, month, day, hour, minute, 0, 0),  function () {
        res.redirect('/dashboard');
    });
}));

/*
|--------------------------------------------------------------------------
| CHAT RUTE
|--------------------------------------------------------------------------
*/

//Ruta za ucitavane poruka za konsultaciju
routes.push(router.post('/chat/messages', function (req, res) {
    var consultHash = req.body.consultHash;
    var userHash = req.body.userHash;

    if (!req.session.isLoged)
        return res.status(400).json('Nemate pravo pristupa podatcima.');

     //Dekripcija
    var consult = '';
    var user = '';
    try {
        var decipher = crypto.createDecipher('aes256', key);
        consult = decipher.update(consultHash, 'hex', 'utf8');
        consult += decipher.final('utf8');
        decipher = crypto.createDecipher('aes256', key);
        user = decipher.update(userHash, 'hex', 'utf8');
        user += decipher.final('utf8');
    } catch (err) {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }

    if (req.session.user.id != user)
        return res.status(400).json('Nemate pravo pristupa podatcima.');

    storage.findConsultById(consult, consult => {
        if (consult == null)
            return res.status(400).json('Nemate prava pristupa ovim podatcima');
        try {
            storage.findConsultMessages(consult, messages => {
                for (var i = 0; i < messages.length; i++) {
                    var returnmessage = {};
                    returnmessage.message = messages[i].content;
                    if (messages[i].studentId != null) {
                        returnmessage.my = messages[i].studentId == user;
                        returnmessage.user_type = 'student';
                        returnmessage.username = messages[i].student.name;
                    }
                    else if (messages[i].professorId != null) {
                        returnmessage.my = messages[i].professorId == user;
                        returnmessage.user_type = 'professor';
                        returnmessage.username = messages[i].professor.name;
                    }
                    returnmessage.date = messages[i].createdAt;
                    messages[i] = returnmessage;
                }
                res.json(messages);
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json('Greska prilikom pribavljanja podataka.');
        }
    });
}));

//Ruta za ucitavanje studenata za konsultaciju
routes.push(router.post('/chat/students', function (req, res) {
    var consultHash = req.body.consultHash;
    var userHash = req.body.userHash;

    if (!req.session.isLoged)
        return res.status(400).json('Niste ulogovani, nemate pravo pristupa podatcima.');

    //Dekripcija
    var consult = '';
    var user = '';
    try {
        var decipher = crypto.createDecipher('aes256', key);
        consult = decipher.update(consultHash, 'hex', 'utf8');
        consult += decipher.final('utf8');
        decipher = crypto.createDecipher('aes256', key);
        user = decipher.update(userHash, 'hex', 'utf8');
        user += decipher.final('utf8');
    } catch (err) {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }

    if (req.session.user.id != user)
        return res.status(400).json('Nemate pravo pristupa podatcima.');

    //Pronalazenje konsultacije i podataka
    try {
        storage.findConsultById(consult, consult => {
            if (consult == null)
                return res.status(400).json('Nemate prava pristupa ovim podatcima, pogresan consultHash.');
            else
                storage.findConsultStudents(consult, students => {
                    for (var i = 0; i < students.length; i++) {
                        var returnstudent = {};
                        returnstudent.name = students[i].name;
                        returnstudent.attend = {};
                        returnstudent.attend.status = students[i].CONSULT_ATTEND.status;
                        students[i] = returnstudent;
                    }
                    return res.json(students);
                });
        });
    } catch (err) {
        console.log(err);
        return res.status(400).json('Greska prilikom pribavljanja podataka.');
    }
    
}));

//Uploadovanej fajla
routes.push(router.post('/chat/file/upload', function (req, res) {
    if (!req.session.isLoged)
        return res.status(400).json('Nemate pravo pristupa.');
    try {
        var fileAdress = null;
        var form = new formidable.IncomingForm();
        form.multiples = false

        //Hesiranej foldera za cuvanje fajla
        var date = new Date();
        var hmac = crypto.createHmac('sha256', hash);
        hmac.update(date.toString());
        var hashDir = hmac.digest('hex');

        form.uploadDir = path.join('./public/uploads/files', hashDir);
        if (!fs.existsSync(form.uploadDir)) {
            fs.mkdirSync(form.uploadDir);
        }

        form.on('file', function (field, file) {
            fileAdress = path.join(form.uploadDir, file.name);
            fs.rename(file.path, fileAdress);
        });
        form.on('error', function (err) {
            console.log('An error has occured: \n' + err);
        });
        form.on('end', function () {
            res.json({ link: fileAdress.substring(7), name: path.win32.basename(fileAdress) });
        });
        form.parse(req);
    } catch (err) {
        console.log(err);
        return res.status(400).json('Greska prilikom uploadovanja fajla.');
    }
    
}));

//Uploadovanej slike
routes.push(router.post('/chat/image/upload', function (req, res) {
    if (!req.session.isLoged)
        return res.status(400).json('Nemate pravo pristupa.');

    try {
        var imageAddres = null;
        var form = new formidable.IncomingForm();
        form.multiples = false

        form.uploadDir = path.join('./public/uploads/images');
        if (!fs.existsSync(form.uploadDir)) {
            fs.mkdirSync(form.uploadDir);
        }

        form.on('file', function (field, file) {
            var date = new Date();
            var hmac = crypto.createHmac('sha256', hash);
            hmac.update(date.toString() + file.name);
            var hashName = hmac.digest('hex');
            imageAddres = path.join(form.uploadDir, hashName + path.extname(file.name))
            fs.rename(file.path, imageAddres);
        });
        form.on('error', function (err) {
            console.log('An error has occured: \n' + err);
        });
        form.on('end', function () {
            res.json({ link: imageAddres.substring(7) });
        });
        form.parse(req);
    } catch (err) {
        console.log(err);
        return res.status(400).json('Greska prilikom uploadovanja slike.');
    }
}));

module.exports = routes;