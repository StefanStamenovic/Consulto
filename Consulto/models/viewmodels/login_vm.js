"use strict";

var ViewModel = require(__dirname + "/viewmodel.js");

function Login_vm() {
    this.ViewModel = ViewModel;
    this.ViewModel();

    var self = this;
}
module.exports = Login_vm;