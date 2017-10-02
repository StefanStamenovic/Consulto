"use strict";

var ViewModel = require(__dirname + "/viewmodel.js");

function Signup_vm() {
    this.ViewModel = ViewModel;
    this.ViewModel();

    var self = this;
}
module.exports = Signup_vm;