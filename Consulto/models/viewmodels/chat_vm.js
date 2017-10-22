"use strict";

var ViewModel = require(__dirname + "/viewmodel.js");

function Chat_vm() {
    this.ViewModel = ViewModel;
    this.ViewModel();

    var self = this;
    this.user_type;
    this.consult;
    this.messages;
    this.subject;
    this.professor;
    this.students;
    this.consultHash;
    this.userHash;
};

module.exports = Chat_vm;