"use strict";

var ViewModel = require(__dirname + "/viewmodel.js");

function Chat_vm() {
    this.ViewModel = ViewModel;
    this.ViewModel();

    var self = this;
    this.user_type;
};

module.exports = Chat_vm;