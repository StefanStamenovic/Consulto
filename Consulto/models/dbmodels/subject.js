"use strict";

var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    //Model u bazi za predmet
    var Subject = sequelize.define('SUBJECT', {
        name: { type: Sequelize.STRING, allowNull: false },
        year: { type: Sequelize.INTEGER, allowNull: false, validate: { isNumeric: true, min: 1, max: 6 } },
        status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
    });
    return Subject;
};