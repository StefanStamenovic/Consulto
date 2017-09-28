"use strict";

var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    //Model u bazi za studenta
    var Student = sequelize.define('STUDENT', {
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, validate: { isEmail: true } },
        password: { type: Sequelize.STRING, allowNull: false },
        status: { type: Sequelize.BOOLEAN, defaultValue: false },
        index: { type: Sequelize.STRING, unique: true, allowNull: false },
        year: { type: Sequelize.INTEGER, allowNull: false, validate: { isNumeric: true, min: 1, max: 6 } }
    });
    return Student;
};