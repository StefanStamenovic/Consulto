"use strict";

var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //Model u bazi za konsultaciju
    var Consult = sequelize.define('CONSULT', {
        subject: { type: Sequelize.STRING, allowNull: false },
        sc_time: { type: Sequelize.DATE, validate: { isDate: true, isAfter: Sequelize.NOW } }, //Scheduled time
        s_time: { type: Sequelize.DATE, validate: { isDate: true} }, //Start time
        status: { type: Sequelize.BOOLEAN, defaultValue: false },
        e_time: { type: Sequelize.DATE, validate: { isDate: true} } // End time
    });
    return Consult;
};