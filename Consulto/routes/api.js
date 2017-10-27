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
var mailer = require('../helpers/email-service');
//Iskljucivanje email servisa da nebi spamovao mejlove
mailer.disable();
var synchro = require('../helpers/synchro');
//Ukljucivanje schedule
var schedule = require('../helpers/schedule');
//Interval provere je 24 sata
schedule.startAccountCheck(1000 * 60 * 60 * 24);
//Startuje se notifikacija o pocetku konsultacije
schedule.newConsultNotification();


var storage = models.Storage;

var routes = [];
/*
|--------------------------------------------------------------------------
| SIGN AND LOG RUTE
|--------------------------------------------------------------------------
*/
//Krejiranje novog naloga za studenta
routes.push(router.post('/signup/student', function (req, res) {
    //Provera podataka
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var index = req.body.index;
    var year = req.body.year;

    if (!name || !email || !password || !index || !year)
        return res.status(400).json("Nevalidna vrednost nekog od polja.");
    if (password.length < 5)
        return res.status(400).json("Sifra je prekratka");
    if (year < 0 || year > 5)
        return res.status(400).json("Nevalidna vrednost godine, validen vrednosti su od 1-5");
    if (!(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
        return res.status(400).json("Nevalidna email adresa, dozvoljeni domeni su @elfak.rs i @elfak.ni.ac.rs.");

    storage.findUserByEmail(email, (user, type) => {
        if (user != null)
            return res.status(400).json("Postoji nalog za datu email adresu.");
        storage.checkIsIndexInUse(index, exist => {
            if (exist)
                return res.status(400).json("Nalog sa ovim brojem indeksa vec postoji.");
            try {
                //Hesiranje sifre
                var hmac = crypto.createHmac('sha512', hash);
                hmac.update(password);
                var hashPassword = hmac.digest('hex');

                var code = (Math.floor(Math.random() * 89999) + 10000).toString();

                mailer.sendActivationCodeEmail(email, code);
                storage.createStudent(name, email, hashPassword, index, year, code, () => {
                    return res.json(true);
                });

            } catch (e) {
                return res.status(400).json("Greska prilikom krejiranja naloga.");
            }
        });
    });
}));

//Krejiranje novog naloga za profesora
routes.push(router.post('/signup/professor', function (req, res) {
    //Provera podataka
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    if (!name || !email || !password)
        return res.status(400).json("Nevalidna vrednost nekog od polja.");
    if (password.length < 5)
        return res.status(400).json("Sifra je prekratka");
    if (!(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
        return res.status(400).json("Nevalidna email adresa, dozvoljeni domeni su @elfak.rs i @elfak.ni.ac.rs.");

    storage.findUserByEmail(email, (user, type) => {
       if (user != null)
            return res.status(400).json("Postoji nalog za datu email adresu.");
        try {
            //Hesiranje sifre
            var hmac = crypto.createHmac('sha512', hash);
            hmac.update(password);
            var hashPassword = hmac.digest('hex');

            var code = (Math.floor(Math.random() * 89999) + 10000).toString();

            mailer.sendActivationCodeEmail(email, code);

            //Okretanje koda za profesora
            code = code.split("").reverse().join("");
            storage.createProfessor(name, email, hashPassword, code, () => {
                return res.json(true);
            });

        } catch (e) {
            return res.status(400).json("Greska prilikom krejiranja naloga.");
        }
    });
}));

//Ponovno slaje aktivacionog koda
routes.push(router.post('/login/resendcq', function (req, res) {
    var email = req.body.email;
    if (!email || !(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
        return res.status(400).json("Nevalidna email adresa.");
    storage.findUserByEmail(email, (user, type) => {
        if (user == null)
            return res.status(400).json("Nepostojeci korisnik, mozda vam je nalog obrisan jer nije na vreme unesen kod potvrde.");
        var code = user.confirmCode;
        if (type == 'professor')
            code = code.split("").reverse().join("");
        mailer.sendActivationCodeEmail(email, code);
        return res.json(true);
    });
}));

//Provera aktivacionog koda i potvrda naloga ako je sve uredu
routes.push(router.post('/login/confirm', function (req, res) {
    var email = req.body.email;
    var confcode = req.body.confcode;
    if (!email || !(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
        return res.status(400).json("Nevalidna email adresa.");
    storage.findUserByEmail(email, (user, type) => {
        if (user == null)
            return res.status(400).json("Nepostojeci korisnik, mozda vam je nalog obrisan jer nije na vreme unesen kod potvrde.");
        if (user.confirmCode == confcode)
            storage.userConfirmed(email, type, function () {
                return;
            });
        return res.json((user.confirmCode == confcode) ? true : false);
    });
}));

//Provera podataka o logovanju kao i provera da li je potvrdjen nalog
routes.push(router.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password)
        return res.status(400).json("Prazno polje.");
    if (password.length < 5)
        return res.status(400).json("Sifra je prekratka");
    if (!(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
        return res.status(400).json("Nevalidna email adresa, dozvoljeni domeni su @elfak.rs i @elfak.ni.ac.rs.");

    storage.findUserByEmail(email, function (user, user_type) {
        if (user == null || !user.confirmed)
            return res.json({ login: false, confirmed: false });

        try {
            var hmac = crypto.createHmac('sha512', hash);
            hmac.update(password);
            var hashPassword = hmac.digest('hex');

            if (user.password == hashPassword) {
                req.session.isLoged = true;
                req.session.user_type = user_type;
                req.session.user = user;
                user.update({ status: true }).then(() => {
                    return res.json({ login: true, confirmed: true });
                });
            }
            else
                return res.json({ login: false, confirmed: true });
        } catch (e) {
            return res.status(400).json("Greska prilikom logovanja.");
        }
    });
}));

/*
|--------------------------------------------------------------------------
| DASHBOARD RUTE
|--------------------------------------------------------------------------
*/

//Ruta za krejiranje predmeta od strane profesora
routes.push(router.post('/subject/create', function (req, res) {
    var subject = req.body.subject;
    var year = req.body.year;

    if (!subject || !year)
        return res.status(400).json('Prazan parametar');
    if (year < 1 || year > 5)
        return res.status(400).json('Pogresan vrednost za godinu.');
    if (!req.session.isLoged || req.session.user_type != 'professor') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.createSubject(req.session.user, subject, year, function () {
        res.json(true);
    });
}));

//Promena statusa predmeta na aktivan od strane profesora
routes.push(router.post('/subject/activate', function (req, res) {
    var subject = req.body.subject;

    if (!req.session.isLoged || req.session.user_type != 'professor') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.subjectOn(subject.id, function () {
            res.json(true);
        });
    });
}));

//Promena statusa predmeta na ugasen od strane profesora
routes.push(router.post('/subject/deactivate', function (req, res) {
    var subject = req.body.subject;

    if (!req.session.isLoged || req.session.user_type != 'professor') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.subjectOff(subject.id, function () {
            res.json(true);
        });
    });
}));


//Ruta za selektovanje predmeta od strane studenta
routes.push(router.post('/subject/select', function (req, res) {
    var subject = req.body.subject;
    if (!req.session.isLoged || req.session.user_type != 'student') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.selectSubjectForStudent(req.session.user, subject.id, function () {
            res.json(true);
        });
    });
}));

//Ruta za odjavu predmeta od strane studenta
routes.push(router.post('/subject/deselect', function (req, res) {
    var subject = req.body.subject;
    if (!req.session.isLoged || req.session.user_type != 'student') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.deselectSubjectForStudent(req.session.user, subject.id, function () {
            res.json(true);
        });
    });
}));

//|--------------------------------------------------------------------------

//Ruta za slanje zahteva za konsultaciju od strane studenta
routes.push(router.post('/consultrequest/request', function (req, res) {
    var subject = req.body.subject;
    var req_subject = req.body.req_subject;

    var date = req.body.sc_date;
    var nowdate = new Date() + new Date().getTimezoneOffset() * 60000;

    if(!subject || !req_subject || !date)
        return res.status(400).json('Prazno polje.');
    if (!req.session.isLoged || req.session.user_type != 'student') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    if (new Date(date) > new Date(nowdate))
        return res.status(400).json('Nevalidno vreme.');
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.requestConsult(req.session.user, subject.id, req_subject, date, function () {
            storage.findSubjectProfessor(subject.id, function (professor) {
                synchro.io().sockets.in('professor-' + professor.id).emit('dashboard consult request created');
                mailer.sendConsultRequestEmail(professor.email, subject.name, req_subject, date);
                res.json(true);
            });
        });
    });
}));

//Ruta za brisanjezahteva od strane studenta
routes.push(router.post('/consultrequest/delete', function (req, res) {
    var subject = req.body.subject;

    if (!subject)
        return res.status(400).json('Prazno polje.');
    if (!req.session.isLoged || req.session.user_type != 'student') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.deleteConsultRequest(req.session.user.id, subject.id, function () {
            synchro.io().sockets.in('professor-' + subject.professorId).emit('dashboard consult request deleted');
            res.json(true);
        });
    }); 
}));

//Ruta za odbijanej zahteva za konsultaciju od strane profesora
routes.push(router.post('/consultrequest/reject', function (req, res) {
    var student = req.body.student;
    var subject = req.body.subject;

    if (!subject)
        return res.status(400).json('Prazno polje.');
    if (!req.session.isLoged || req.session.user_type != 'professor') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.rejectedConsultRequest(student, subject.id, function () {
            synchro.io().sockets.in('student-' + student).emit('dashboard consult request rejected');
            res.json(true);
        });
    });
}));

//|--------------------------------------------------------------------------

//Ruta za kreiranje  konsultacije od strane profesora
routes.push(router.post('/consult/create', function (req, res) {
    var subject = req.body.subject;
    var cons_subject = req.body.cons_subject;
    var date = req.body.sc_date;

    var nowdate = new Date() + new Date().getTimezoneOffset() * 60000;

    if (!subject || !cons_subject || !date)
        return res.status(400).json('Prazno polje.');
    if (!req.session.isLoged || req.session.user_type != 'professor') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    if (new Date(date) > new Date(nowdate))
        return res.status(400).json('Nevalidno vreme.');
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        storage.createConsult(subject.id, cons_subject, date, function () {
            synchro.io().sockets.in('subject-' + subject.id).emit('dasboard consult created');
            schedule.newConsultNotification();
            res.json(true);
        });
    });
}));

//Ruta za kreiranje zahtevane konsultacije za profesora
routes.push(router.post('/consult/createrequested', function (req, res) {
    var subject = req.body.subject;
    var student = req.body.student;
    var cons_subject = req.body.cons_subject;
    var date = req.body.sc_date;

    var nowdate = new Date() + new Date().getTimezoneOffset() * 60000;

    if (!subject || !cons_subject || !date || !student)
        return res.status(400).json('Prazno polje.');
    if (!req.session.isLoged || req.session.user_type != 'professor') {
        return res.status(400).json('Nemate prava pristupa ovim podatcima');
    }
    if (new Date(date) > new Date(nowdate))
        return res.status(400).json('Nevalidno vreme.');
    storage.findSubjecById(subject, subject => {
        if (!subject)
            return res.status(400).json('Ne postoji predmet.');
        models.dbmodels.ConsultRequest.findOne({ where: { studentId: student, subjectId: subject.id } }).then(request => {
            if (!request)
                return res.status(400).json('Ne postoji zahtev.');
            else
                request.update({ status: 'approved' }).then(() => {
                    storage.createConsult(subject.id, cons_subject, date, function () {
                        synchro.io().sockets.in('subject-' + subject.id).emit('dasboard consult created');
                        schedule.newConsultNotification();
                        res.json(true);
                    });
                });
        });
        
    });
}));

//|--------------------------------------------------------------------------


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