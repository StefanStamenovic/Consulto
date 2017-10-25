'use strict'
var models = require('../models');
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
        console.log(getNowDate());
    }

    //Startuje sistem za notifikaciju 
    this.startConsultNotification = function () {
        try {
            if (this.timeout != null || this.nextNotifConsult)
                throw new Error('Notifikacija za konsultacije je vec startovana.');
            else
                storage.findNextConsultForNotification(consult => {
                    try {
                        if (consult != null) {
                            timems = consult.sc_time - getNowDate();
                            this.nextNotifConsult = consult;
                            this.timeout = setTimeout(this.consultNotification, timems);
                        }
                        else {
                            //Fake consult
                            this.nextNotifConsult = { sc_time: new Date() };
                        }
                    } catch (e) {
                        console.errr(e);
                    }
                });

        } catch (e) {
            console.warn(e);
        }
    }

    //Nova konsultacija je napravljena proveri da li je sledeca za notifikaciju 
    this.newConsultNotifi = function (consult) {
        try {
            if (this.nextNotifConsult == null)
                throw Error("Sistem notifikacije novih konsultacija nije startovan.")

            if (this.nextNotifConsult.sc_time > consult.sc_time) {
                this.nextNotifConsult = consult;

                var timems = nextConsultTime - getNowDate();
                if (this.timeout != null)
                    clearTimeout(this.timeout);
                this.timeout = setTimeout(this.consultNotification, timems);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    //Funkcija koja vrsi notifikaciju profesora za pocetak konsultacije
    this.consultNotification = function () {

    }

    //Vraca vreme na serveru
    function getNowDate() {
        return new Date() + new Date().getTimezoneOffset() * 60000;
    }
}

module.exports = new Schedule();