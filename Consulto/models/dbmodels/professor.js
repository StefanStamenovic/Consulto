﻿"use strict";

var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    //Model u bazi za profesora
    var Professor = sequelize.define('PROFESSOR', {
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
        password: { type: Sequelize.STRING, allowNull: false },
        status: { type: Sequelize.BOOLEAN, defaultValue: false },
        confirmCode: { type: Sequelize.STRING, allowNull: true },
        confirmed: { type: Sequelize.BOOLEAN, defaultValue: false }
    });
    return Professor;
};