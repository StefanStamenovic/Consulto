"use strict";

var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    //Model u bazi za poruku
    var Message = sequelize.define('MESSAGE', {
        content: { type: Sequelize.TEXT }
    });
    return Message;
};