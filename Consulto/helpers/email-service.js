'use strict'
var nodemailer = require('nodemailer');
var config = require('config');
var emailconfig = config.get('config.emailconfig');

var EmailService = function () {
    var enabled = true;
    var transporter = nodemailer.createTransport({
        service: emailconfig.service,
        auth: {
            user: emailconfig.user,
            pass: emailconfig.pass
        }
    });

    //Iskljucuje za potrebe testiranja
    this.disable = function(){
        enabled = false;
    }

    //Slanje poruke sa aktivacionim kodim
    this.sendActivationCodeEmail = function (email, code) {
        console.log('Email sent: Aktivacioni kod:' + code);
        if (!enabled)
            return;
        var mailOptions = {
            from: emailconfig.user,
            to: email,
            subject: 'Aktivacioni kod za potvrdu registracije.',
            html: '<p style=\'font-size: 18px;\'>Aktivacioni kod:</p><h3>' + code + '</h3>'
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }

    //Salje poruku obavestenja o pocetku zakazane konsultacije
    this.sendConsulReminderEmail = function (email, consult, subject) {
        console.log('Email sent: Konsultacija sa temom:' + consult.subject);
        if (!enabled)
            return;
        var mailOptions = {
            from: emailconfig.user,
            to: email,
            subject: '"' + subject + '" podestnik o pocetku konsultacije',
            html: '<p>Tema konsultacije: <strong style=\'font-size: 16px;\'>' + consult.subject + '</strong></p><p>Zakazano vreme pocetka <strong>' + consult.sc_time.toLocaleString() + '</strong></p>'
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }

    //Poruka za profesora da je dobio novi zahtev
    this.sendConsultRequestEmail = function (email, subject, reqsubject, date) {
        console.log('Email sent: Request za konsultaciju iz predmeta:' + subject);
        if (!enabled)
            return;
        var mailOptions = {
            from: emailconfig.user,
            to: email,
            subject: '"' + subject + '" novi zahtev za konsultaciju',
            html: '<p>Tema konsultacije: <strong style=\'font-size: 16px;\'>' + reqsubject + '</strong></p><p>Za <strong>' + consult.sc_time.toDateString() + '</strong></p>'
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

module.exports = new EmailService;