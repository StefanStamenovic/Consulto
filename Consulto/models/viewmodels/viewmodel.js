"use strict";
var config = require('config');
var appname = config.get('config.appname');
function ViewModel() {
    var self = this;

    this.error;
    this.title;
    this.appName = appname;
    this.isLoged;
    this.user;
}
module.exports = ViewModel;