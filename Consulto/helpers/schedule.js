'use strict'
var models = require('../models');
var mailer = require('./email-service');
var synchro = require('../helpers/synchro');
var storage = models.Storage;

var Schedule = function () {
    this.timeout = null;
    this.interval = null;
    this.nextNotifConsult = null;

    //Startuje proveru accounta
    this.startAccountCheck = function (intervalTime) {
        try {
            if (this.interval == null)
                this.interval = setInterval(this.accountConfirmChecking, intervalTime);
            else
                throw new Error('Nemoze se startovati account check vise od jednog puta. Zaustavite pa ponovo startujte sa novim intervalom.');
        } catch (e) {
            console.warn(e);
        }
    }

    //Stopira proveru accounta
    this.stopAccountCheck = function () {
        try {
            if (this.interval != null)
                clearInterval(this.interval);
            else
                throw new Error('Account check je vec zaustavljen.');
        } catch (e) {
            console.warn(e);
        }
    }

    //Funkcija koja brise sve naloge koji nisu potvrdjeni
    this.accountConfirmChecking = function () {
        storage.deleteUnconfirmedUsers(function () {
        });
    }

    //Nova konsultacija je napravljena proveri da li je sledeca za notifikaciju 
    this.newConsultNotification = function () {
        try {
            storage.findNextConsultForNotification(consult => {
                try {
                    if (!this.nextNotifConsult)
                        this.nextNotifConsult = { id: -1, sc_time: getNowDate() };
                    if (consult != null && this.nextNotifConsult.id != consult.id) {
                        timems = consult.sc_time - getNowDate();
                        this.nextNotifConsult = consult;
                        this.timeout = setTimeout(this.consultNotification, timems);
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        } catch (e) {
            console.warn(e);
        }
    }

    //Funkcija koja vrsi notifikaciju profesora za pocetak konsultacije
    this.consultNotification = function () {
        storage.findConsultSubject(nextNotifConsult, subject => {
            storage.findConsultProfessor(nextNotifConsult, professor => {
                try {
                    synchro.io().sockets.in('professor-' + professor.id).emit('dashboard consult ready');
                    storage.sendConsulReminderEmail(professor.email, consult, subject.name);
                    this.newConsultNotification();
                } catch (e){
                    console.warn(e);
                }
            });
        });
    }

    //Vraca vreme na serveru
    function getNowDate() {
        return new Date() + new Date().getTimezoneOffset() * 60000;
    }
}

module.exports = new Schedule();