'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

//------------------------------------- Ukljucivanje definicija sequelize orm modela kao i inicijalizacija storagea -------------------------------------//
var models = require('./models');
models.sequelize.sync();
//------------------------------------- Podesavanje i postavljanje aplikacije kao express aplikacija -------------------------------------//
var app = express();

//Ukljucivanje stranica za prikaz
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Podesavanje sesije na 1 godinu
app.use(session({ secret: 'keyboard cat', cookie: { expires: false, maxAge: 365 * 24 * 60 * 60 * 1000 } }));

//------------------------------------- Registracija ruta aplikacije i apija -------------------------------------//
var index_route = require('./routes/index');
var login_route = require('./routes/login');
var signup_route = require('./routes/signup');
var dashboard_route = require('./routes/dashboard');
var chat_route = require('./routes/chat');

app.use(index_route);
app.use(login_route);
app.use(signup_route);
app.use(dashboard_route);
app.use(chat_route);
var test_route = require('./routes/test');
app.use(test_route);

var api_routes= require('./routes/api');
api_routes.forEach(function (route) {
    app.use(route);
});
//------------------------------------- Rukovodjenje greskama -------------------------------------//
//Prijava Not Found greske
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
//Prijava gresaka tokom razvoja
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
//Prijava gresaka na serveru
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

//------------------------------------- Pokretanje servera i socket.io-------------------------------------//
//Pokretanje servera
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

//Ukjucivanje socket.io za rad sa realtime komunikacijom
var synchro = require('./helpers/synchro');
synchro.initialize(server);