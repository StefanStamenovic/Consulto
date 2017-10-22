'use strict'
var models = require('../models');
var crypto = require('crypto');
var config = require('config');
var key = config.get('config.key');

module.exports = function (server){ 
    var server = require('socket.io')(server);
    var storage = new models.Storage();
    server.on('connection', function (socket) {

        //Korisnik se odkonektovao
        socket.on('disconnect', function () {
            //Diskonektovanje sa chata
            if (socket.consultRoom != null && socket.consultRoom != undefined) {
                try {
                    //Provera da li je korisnik konektovan sa vise pristupnih tacaka
                    var clients = server.sockets.adapter.rooms[socket.consultRoom];
                    var connected = false;
                    if (clients != undefined)
                    {
                        for (var clientId in clients.sockets) {
                            if (server.sockets.connected[clientId].consultUser == socket.consultUser) {
                                connected = true;
                                break;
                            }
                        }
                    }
                    if (!connected) {
                        storage.findConsultById(socket.consult, consult => {
                            if (consult == null)
                                return socket.emit('socket error', { action: 'disconnect chat user', error: 'Nemoguca je diskonekcija sa konsultacije, nesto nije uredu.' });
                            if (consult.e_time == null) {
                                storage.findConsultProfessor(consult, professor => {
                                    if (professor.id == socket.consultUser && socket.consultUser_type == 'professor') {
                                        storage.professorLeftConsult(consult.id, function () {
                                            socket.leave(socket.socketRoom);
                                            server.sockets.in(socket.consultRoom).emit('chat professor disconnected');
                                            socket.consultRoom = undefined;
                                            socket.consultUser = undefined;
                                            socket.consultUser_type = undefined;
                                            socket.consult = undefined;
                                        });
                                    }
                                    else if (socket.consultUser_type == 'student') {
                                        storage.studentLeftConsult(socket.consultUser, consult.id, function () {
                                            socket.leave(socket.socketRoom);
                                            server.sockets.in(socket.consultRoom).emit('chat user disconnected');
                                            socket.consultRoom = undefined;
                                            socket.consultRoom = undefined;
                                            socket.consultUser = undefined;
                                            socket.consultUser_type = undefined;
                                        });
                                    }
                                    else
                                        return socket.emit('socket error', { action: 'disconnect chat user', error: 'Nemoguca je diskonekcija sa konsultacije, nesto nije uredu.' });
                                });
                            }
                        });
                    }
                } catch (err) {
                    console.log(err);
                    return socket.emit('socket error', { action: 'disconnect chat user', error: 'Nemoguca je diskonekcija sa konsultacije, nesto nije uredu.' });
                }
            }
        });

        /*
        |--------------------------------------------------------------------------
        | CHAT FUNKCIJE ZA REALTIME
        |--------------------------------------------------------------------------
        */
        //Korisnik se prikljucio konsultaciji
        socket.on('connect chat user', function (consultHash, userHash, user_type) {
            //Dekodiranje 
            var consult = '';
            var user = '';
            try {
                var decipher = crypto.createDecipher('aes256', key);
                consult = decipher.update(consultHash, 'hex', 'utf8');
                consult += decipher.final('utf8');

                decipher = crypto.createDecipher('aes256', key);
                user = decipher.update(userHash, 'hex', 'utf8');
                user += decipher.final('utf8');
            } catch (err) {
                console.log(err);
                return socket.emit('socket error', { action: 'connect user', error: 'Nemoguca je konekcija na konsultaciju, nesto nije uredu.' });
            }

            try {
                storage.findConsultById(consult, consult => {
                    if (consult == null)
                        return socket.emit('socket error', { action: 'connect user', error: 'Nemoguca je konekcija na konsultaciju, nesto nije uredu.' });

                    if (consult.e_time == null) {
                        storage.findConsultProfessor(consult, professor => {
                            if (professor.id == user && user_type == 'professor') {
                                if (consult.s_time == null) {
                                    storage.startConsult(consult.id, () => {
                                        socket.join('consult-' + consultHash);
                                        socket.consultRoom = 'consult-' + consultHash;
                                        socket.consultUser = user;
                                        socket.consultUser_type = user_type;
                                        socket.consult = consult.id;
                                        server.sockets.in(socket.consultRoom).emit('chat professor connected');
                                        //TODO: Dodati notifikaciju korisnika na predmetu o pocetku
                                    });
                                }
                                else {
                                    storage.professorJoinedConsult(consult.id, function () {
                                        socket.join('consult-' + consultHash);
                                        socket.consultRoom = 'consult-' + consultHash;
                                        socket.consultUser = user;
                                        socket.consultUser_type = user_type;
                                        socket.consult = consult.id;
                                        server.sockets.in(socket.consultRoom).emit('chat professor connected');
                                    });
                                }
                            }
                            else if (user_type == 'student'){
                                storage.studentJoinedConsult(user, consult.id, function () {
                                    socket.join('consult-' + consultHash);
                                    socket.consultRoom = 'consult-' + consultHash;
                                    socket.consultUser = user;
                                    socket.consultUser_type = user_type;
                                    socket.consult = consult.id;

                                    server.sockets.in(socket.consultRoom).emit('chat user connected');
                                });
                            }
                            else
                                return socket.emit('socket error', { action: 'connect user', error: 'Nemoguca je konekcija na konsultaciju, nesto nije uredu.' });
                        });
                    }
                });
            } catch (err) {
                console.log(err);
                return socket.emit('socket error', { action: 'connect user', error: 'Nemoguca je konekcija na konsultaciju, nesto nije uredu.' });
            }
        });

        //Ako se primi poruka na chat stranici
        socket.on('chat send message', function (message) {

            if (socket.consultRoom == null || socket.consultRoom == undefined)
                return socket.emit('socket error', { action: 'chat send message', error: 'Nemate dozvolu slanja poruke za ovu konsultaciju.' });

            try {
                storage.findConsultById(socket.consult, consult => {
                    if (consult == null)
                        return socket.emit('socket error', { action: 'chat send message', error: 'Nemate dozvolu slanja poruke za ovu konsultaciju.' });

                    if (socket.consultUser_type == 'professor')
                        storage.findConsultProfessor(consult, professor => {
                            if (professor.id == socket.consultUser)
                                storage.createMessageProfessor(message, consult.id, socket.consultUser, () => {
                                    socket.broadcast.to(socket.consultRoom).emit('chat receive message', message, professor.name, 'professor', new Date());
                                });
                            else
                                return socket.emit('error', { action: 'chat send message', error: 'Nemate dozvolu slanja poruke za ovu konsultaciju.' });
                        });
                    else if (socket.consultUser_type == 'student')
                        storage.findConsultStudents(consult, students => {
                            var consultstudent = null;
                            students.forEach(student => {
                                if (student.id == socket.consultUser)
                                    consultstudent = student;
                            });
                            if (consultstudent == null)
                                return socket.emit('socket error', { action: 'chat send message', error: 'Nemate dozvolu slanja poruke za ovu konsultaciju.' });
                            else
                                storage.createMessageStudent(message, consult.id, socket.consultUser, () => {
                                    socket.broadcast.to(socket.consultRoom).emit('chat receive message', message, consultstudent.name, 'student', new Date());
                                });
                        });
                    else
                       return socket.emit('socket error', { action: 'send message', error: 'Niste validan korisnik, poruka nije poslata.' });
                });
            } catch (err) {
                console.log(err);
                return socket.emit('socket error', { action: 'send message', error: 'Poruka nije poslata, doslo je do greske.' });
            }
        });

        //Kada profesor prekine konsultaciju
        socket.on('end chat consult', function () {
            if (socket.consultRoom == null || socket.consultRoom == undefined)
                return socket.emit('socket error', { action: 'end consult', error: 'Niste autorizovani za ovu akciju.' });
            try {
                storage.findConsultById(socket.consult, consult => {
                    if (consult == null)
                        return socket.emit('socket error', { action: 'end consult', error: 'Nesto nije uredu konsultacija nije zavrsena.' });

                    if (socket.consultUser_type == 'professor')
                        storage.findConsultProfessor(consult, professor => {
                            if (professor.id == socket.consultUser)
                                storage.endConsult(consult.id, () => {
                                    server.sockets.in(socket.consultRoom).emit('chat consult ended');
                                    //TODO: Notificirati sve da je zavrsena konsultacija.
                                });
                            else
                                return socket.emit('socket error', { action: 'end consult', error: 'Niste autorizovani za ovu akciju.' });
                        });
                    else
                        return socket.emit('socket error', { action: 'end consult', error: 'Niste autorizovani za ovu akciju.' });
                });
            } catch (err) {
                console.log(err);
                return socket.emit('socket error', { action: 'end consult', error: 'Niste autorizovani za ovu akciju.' });
            }
        });
        /*
        |--------------------------------------------------------------------------
        | DASHBOARD FUNKCIJE ZA REALTIME
        |--------------------------------------------------------------------------
        */
        //Student je napravio novi zahtev za konsultaciju
        socket.on('consult request', function () {
            console.log('new request');
        });
        //Profesor je napravio novu konsultaciju
        socket.on('consult created', function () { });
    });
}