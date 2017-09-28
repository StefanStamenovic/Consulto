"use strict";

var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //Model u bazi za konsultaciju
    var Consult = sequelize.define('CONSULT', {
        s_time: { type: Sequelize.DATE, validate: { isDate: true, isAfter: Sequelize.NOW } }, //Start time
        status: { type: Sequelize.BOOLEAN, defaultValue: false },
        e_time: { type: Sequelize.DATE, validate: { isDate: true } } // End time
    });
    return Consult;
};