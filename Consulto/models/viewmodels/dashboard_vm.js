﻿"use strict";

var ViewModel = require(__dirname + "/viewmodel.js");

function Dashboard_vm() {
    this.ViewModel = ViewModel;
    this.ViewModel();

    var self = this;
    this.user_type;
    this.userSubjects;
    this.allSubjects;
};

module.exports = Dashboard_vm;