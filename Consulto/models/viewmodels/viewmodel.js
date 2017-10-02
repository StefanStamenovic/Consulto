"use strict";
var config = require('config');
var appname = config.get('config.appname');
function ViewModel() {
    var self = this;

    this.title;
    this.appName = appname;
    this.isLoged;
}
module.exports = ViewModel;