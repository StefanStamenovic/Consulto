$(document).ready(function () {
    //Inicijalizacija socket.io klijenta
    var socket = io();

    //Ucitavanje poruka na pocetku
    $.ajax(
        {
            url: "/chat/messages",
            type: "POST",
            data: { consultHash: consultHash, userHash: userHash },
            success: function (messages) {
                //Updejtovanje liste studenata
                while ($('#messages').children().length) $('#messages').children()[$('#messages').children().length - 1].remove();
                messages.forEach(message => {
                    var date = new Date(message.date);
                    if (message.my)
                        $('#messages').append('<div style="width:100%;display: flow-root;">' +
                                        '<div class="message-right pull-right" style="max-width: 80%;overflow:hidden;border-right:5px solid ' + ((message.user_type == "student") ? '#75caeb;' : '#158cba;') + '">' +
                                            '<div class="row message-left-content" style="margin-left: 10px; overflow-x: auto;margin-right: 0px;padding-right: 10px;">' +
                                                '<h5 style="white-space: pre-wrap;word-wrap: break-word; ">' + message.message + '</h5>' +
                                            '</div>' +
                                            '<div class="pull-left" style="margin-right: 0px; padding-left: 15px">' +
                                                '<p class="text-muted small">' + date.getHours() + ':' + date.getMinutes() + ' ' + date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear() + '</p>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>');
                    else
                        $('#messages').append('<div style="width:100%;">' +
                                                '<div class="message-left" style="max-width: 80%;overflow:hidden;border-left:5px solid ' + ((message.user_type == "student") ? '#75caeb;' : '#158cba;') + '">' +
                                                    '<div class="row clearfix message-left-title">' +
                                                        '<p style="margin-right: 10px;padding-left: 20px;"><strong id="msg_user">' + message.username + '</strong></p>' +
                                                    '</div>' +
                                                    '<div class="row message-left-content" style="margin-left: 0px; overflow-x: auto;">' +
                                                        '<h5 style="white-space: pre-wrap;word-wrap: break-word; ">' + message.message + '</h5>' +
                                                    '</div>' +
                                                    '<div class="pull-right" style="margin-left: 0px; padding-right: 15px">' +
                                                        '<p class="text-muted small">' + date.getHours() + ':' + date.getMinutes() + ' ' + date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear() + '</p>' +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>');
                });
                $('#messages').scrollTop($('#messages').prop("scrollHeight"));
            },
            error: function () {
                showError("Greska kod ucitavanja poruka", "Nemogu se pribaviti poruke.");
            }
        });

    //Updejtuje listu prisutnih studenata
    function updateStudentsList() {
        $.ajax(
            {
                url: "/chat/students",
                type: "POST",
                data: {
                    consultHash: consultHash,
                    userHash: userHash
                },
                success: function (students) {
                    //Updejtovanje liste studenata
                    var studentList = $('#student_list');
                    if (students.length != 0)
                        while (studentList.children().length) studentList.children()[studentList.children().length - 1].remove();
                    students.forEach(function (student) {
                        studentList.append('<li class="list-group-item clearfix">' +
                            '<p class="pull-left" style= "margin-bottom: 0px">' + student.name + '</p >' +
                            '<div class="pull-right" style="' + ((student.attend.status) ? 'background-color:lightgreen;' : 'background-color:gainsboro;') + 'height: 10px; width: 10px; border-radius: 50%;margin-top: 5px"></div>' +
                            '</li >');
                    });
                },
                error: function (err) {
                    showError("Greska kod ucitavanja liste studenata", err.responseJSON);
                }
            });
    }

    //Konektovanja korisnika na konsultaciju
    socket.emit('connect chat user', consultHash, userHash, user_type);

    /*
    |--------------------------------------------------------------------------
    | Socket io realtime update
    |--------------------------------------------------------------------------
    */

    //Korisnik se prikljucio konsultaciji
    socket.on('chat user connected', function () {
        updateStudentsList();
    });

    //Korisnik prima poruku
    socket.on('chat receive message', function (message, username, user_type, date) {
        var messages = $('#messages');
        var date = new Date(date);
        messages.append('<div style="width:100%;">' +
                            '<div class="message-left" style="max-width: 80%;overflow:hidden;border-left:5px solid ' + ((user_type == "student") ? '#75caeb;' :'#158cba;') + '">' +
                                '<div class="row clearfix message-left-title">' +
                                    '<p style="margin-right: 10px;padding-left: 20px;"><strong id="msg_user">' + username + '</strong></p>' +
                                '</div>' +
                                '<div class="row message-left-content" style="margin-left: 0px; overflow-x: auto;">' +
                                    '<h5 style="white-space: pre-wrap;word-wrap: break-word; ">' + message + '</h5>' +
                                '</div>' +
                                '<div class="pull-right" style="margin-left: 0px; padding-right: 15px">' +
                                    '<p class="text-muted small">' + date.getHours() + ':' + date.getMinutes() + ' ' + date.getUTCDate() + '/' + (date.getUTCMonth()+1) + '/' + date.getUTCFullYear() + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>');
        $('#messages').scrollTop($('#messages').prop("scrollHeight"));
    });

    //Korisnik je napustio konsultaciju
    socket.on('chat user disconnected', function () {
        updateStudentsList();
    });

    //Konsultacija je zavrsena
    socket.on('chat consult ended', function () {
        //Uklanjanje mogucnosti pisanja poruke
        var chatBar = $('#chat_bar');
        while (chatBar.children().length) chatBar.children()[chatBar.children().length - 1].remove();
        chatBar.append('<div style="height: 38px; width: 100%; border: 1px solid #e2e2e2;margin-top: -1px"><h4 class="text-muted" style="text-align:center">Konsultacija je zavrsena.</h4></div>');
        //Menjanje profesorovaog statusa na neaktivan
        $('#professor_status').css("background-color", "gainsboro");
        //Diskonektovanje studenata
        updateStudentsList();
    });

    //Profesor je napustio konsultaciju ali nije je zavrsio
    socket.on('chat professor connected', function () {
        $('#professor_status').css("background-color", "lightgreen");
    });

    //Profesor se varatio na kosultaciju koju nije zavrsio
    socket.on('chat professor disconnected', function () {
        $('#professor_status').css("background-color", "gainsboro");
    });

    //Prikaz gresaka za socket io
    socket.on('socket error', function (error) {
        $('#error_msg').append('<div class="alert alert-dismissible alert-danger">' +
                                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                                    '<h4>' + 'Za akciju <strong>' + error.action + '</strong></h4>' +
                                    '<p>' + error.error + '</p>' +
                                '</div >');
    });
    //Prikaz neke greske
    function showError(header, message) {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        $('#error_msg').append('<div class="alert alert-dismissible alert-danger">' +
            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
            '<h4><strong>' + header + '</strong></h4>' +
            '<p>' + message + '</p>' +
            '</div >');
    }

    /*
    |--------------------------------------------------------------------------
    | Rad sa kontrolama
    |--------------------------------------------------------------------------
    */
    //Na klik se gubi placeholder
    $("#message").focusin(function () {
        if ($("#message").first() != null && $("#message").first().text() === "Unesite poruku ...")
            $("#message").first().html("");
            $("#message").css("overflow", "auto");
    });

    //Na gubitak fokusa se pojavljuje
    $("#message").focusout(() => {
        if ($("#message").html() === "")
            $("#message").html("<p class=\"text-muted\">Unesite poruku ...</p>");
            $("#message").css("overflow", "hidden");
    });

    //Slanje poruke na Enter
    $("#message").on('keydown', function (e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            if ($("#message").html().length > 0 && $("#message").first().text() != "Unesite poruku ...")
                sendMessage($("#message").html());
            $("#message").html("");
            return false;
        }
    });

    //Ako se pritisne posalji
    $('form').submit(function () {
        if ($("#message").html().length > 0 && $("#message").first().text() != "Unesite poruku ...")
            sendMessage($("#message").html());
        $("#message").focus();
        return false;
    });

    //Salje poruku
    function sendMessage(msg) {
        var date = new Date();
        $('#messages').append('<div style="width:100%;display: flow-root;">' +
                                    '<div class="message-right pull-right" style="max-width: 80%;overflow:hidden;border-right:5px solid ' + ((user_type == "student") ? '#75caeb;' : '#158cba;') + '">' +
                                        '<div class="row message-left-content" style="margin-left: 10px; overflow-x: auto;margin-right: 0px;padding-right: 10px;">' +
                                            '<h5 style="white-space: pre-wrap;word-wrap: break-word; ">' + msg + '</h5>' +
                                        '</div>' +
                                        '<div class="pull-left" style="margin-right: 0px; padding-left: 15px">' +
                                            '<p class="text-muted small">' + date.getHours() + ':' + date.getMinutes() + ' ' + date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear() + '</p>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>');
        $('#messages').scrollTop($('#messages').prop("scrollHeight"));
        socket.emit('chat send message', msg);
        $("#message").text("");
    }

    //Prekida konsultaciju za profesora
    $('#end_button').click(() => {
        socket.emit('end chat consult', userHash, consultHash, user_type);
        $('#end_button').remove();
    });

    /*
    |--------------------------------------------------------------------------
    | Upload fajlova i slika za chat
    |--------------------------------------------------------------------------
    */
    //Dugme za selektovanje fajla
    $('#file-select-button').click(() => {
        $('#file-input').click();
    });

    //Slanje fajla
    $('#file-input').on('change', function () {
        var file = $(this).get(0).files[0];
        if (file != null)
        {
            $('#progress-bar').show();
            $('.progress-bar').width('0%');

            var formData = new FormData();
            formData.append('upload', file, file.name);
            blockUploadButtons();
            $.ajax({
                url: '/chat/file/upload',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    $('#progress-bar').hide();
                    $('.progress-bar').width('0%');
                    $('#file-input').replaceWith($('#file-input').val('').clone(true));
                    var file = '<a role="button" href="' + data.link + '" style="cursor: pointer;text-decoration: none;" ><img src="/images/file.png" style="height: 30px;">' + data.name + '</a>';
                    sendMessage(file);
                    unblockUploadButtons();
                },
                error: function () {
                    showError("Greska kod uploadovanja fajla", "File nije uploadovan jer je doslo do greske pri uploadu.");
                    $('#progress-bar').hide();
                    $('.progress-bar').width('0%');
                    $('#file-input').replaceWith($('#file-input').val('').clone(true)); 
                    unblockUploadButtons();
                },
                xhr: function () {
                    var xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener('progress', function (evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            percentComplete = parseInt(percentComplete * 100);
                            $('.progress-bar').width(percentComplete + '%');
                        }
                    }, false);

                    return xhr;
                }
            });

        }
        else
        {
            $('#progress-bar').hide();
            $('.progress-bar').width('0%');
        }
    });

    //Dugme za selektovanje slike
    $('#image-select-button').click(() => {
        $('#image-input').click();
    });

    //Slanje slike
    $('#image-input').on('change', function () {
        var file = $(this).get(0).files[0];

        if (file != null) {
            var formData = new FormData();
            var file = this.files[0];
            var fileType = file["type"];
            var imgTypes = ["image/gif", "image/jpeg", "image/png"];
            if ($.inArray(fileType, imgTypes) < 0) {
                showError("Greska kod uploadovanja slike", "File nije koji je selektovan nije slika.");
                $('#progress-bar').hide();
                $('.progress-bar').width('0%');
            }
            else {
                $('#progress-bar').show();
                $('.progress-bar').width('0%');

                formData.append('upload', file, file.name);

                blockUploadButtons();
                $.ajax({
                    url: '/chat/image/upload',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        $('#progress-bar').hide();
                        $('.progress-bar').width('0%');
                        $('#image-input').replaceWith($('#image-input').val('').clone(true));
                        var image = '<a role="button" href="' + data.link + '" style="cursor: pointer;text-decoration: none;" ><img src="' + data.link + '" style="width: 250px"></a>';
                        sendMessage(image);

                        unblockUploadButtons();
                    },
                    error: function () {
                        showError("Greska kod uploadovanja slike", "Slika nije uploadovana jer je doslo do greske pri uploadu.");
                        $('#progress-bar').hide();
                        $('.progress-bar').width('0%');
                        $('#image-input').replaceWith($('#image-input').val('').clone(true));
                        unblockUploadButtons();
                    },
                    xhr: function () {
                        var xhr = new XMLHttpRequest();
                        xhr.upload.addEventListener('progress', function (evt) {
                            if (evt.lengthComputable) {
                                var percentComplete = evt.loaded / evt.total;
                                percentComplete = parseInt(percentComplete * 100);
                                $('.progress-bar').width(percentComplete + '%');
                            }
                        }, false);

                        return xhr;
                    }
                });
            }
        }
        else
        {
            $('#progress-bar').hide();
            $('.progress-bar').width('0%');
        }
    });

    //Iskljucuje dugmice
    function blockUploadButtons() {
        $('#file-select-button').unbind('click');
        $('#image-select-button').unbind('click');
    }

    //Iskljucuje dugmice
    function unblockUploadButtons() {
        $('#file-select-button').click(() => {
            $('#file-input').click();
        });
        $('#image-select-button').click(() => {
            $('#image-input').click();
        });
    }
});