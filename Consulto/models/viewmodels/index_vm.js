"use strict";

var ViewModel = require(__dirname + "/viewmodel.js");

function Index_vm() {
    this.ViewModel = ViewModel;
    this.ViewModel();

    var self = this;
};

module.exports = Index_vm;