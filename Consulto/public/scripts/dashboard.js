$(document).ready(function () {
    var socket = io();

    //Konektovanja korisnika na socket.io
    socket.emit('connect dashboard user', userHash, userSubjects, user_type);

    /*
    |--------------------------------------------------------------------------
    | Socket io realtime update
    |--------------------------------------------------------------------------
    */

    //Student je zahtevao novu konsultaciju
    socket.on('dashboard consult request created', function () {
        location.reload();
    });

    //Student je obrisao zahtev za konsultaciju
    socket.on('dashboard consult request deleted', function () {
        location.reload();
    });

    //Profesor je odbio zahtev
    socket.on('dashboard consult request rejected', function () {
        location.reload();
    });

    //Profesor je odobrio zahtev
    socket.on('dashboard consult request approved', function () {
        location.reload();
    });

    //Profesor je zakazao novu konsultaciju
    socket.on('dasboard consult created', function () {
        location.reload();
    });


    //Konsultacija je spremna da pocen
    socket.on('dashboard consult ready', function () {
        location.reload();
    });

    //Konsultacija je pocela
    socket.on('dashboard consult started', function () {
        location.reload();
    });

    //Konsultacija je zavrsena
    socket.on('dashboard consult ended', function () {
        location.reload();
    });

    //Prikaz gresaka za socket io
    socket.on('socket dashboard error', function (error) {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        $('#error_msg').append('<div class="alert alert-dismissible alert-danger">' +
            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
            '<h4>' + 'Za akciju <strong>' + error.action + '</strong></h4>' +
            '<p>' + error.error + '</p>' +
            '</div >');
    });
    /*
    |--------------------------------------------------------------------------
    | Profesor
    |--------------------------------------------------------------------------
    */
    
    //Kreiranje predmeta
    $('#subject-create-submit').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = $('#subject-create-subject').val();
        var year = $('#subject-create-year').val();

        if (!subject || !year)
        {
            $('#subject-create').modal('hide');
            return showError("Imate prazna ne popunjena polja.");
        }
            
        $.ajax({
            url: "/subject/create",
            type: "POST",
            data: {
                subject: subject,
                year: year
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                $('#subject-create').modal('hide');
                showError(err.responseJSON);
            }
        });
    });

    //Deaktivacija predmeta
    $('.subject-deactivate').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = this.attributes.value.nodeValue;
        if (!subject) {
            return showError("Nije selektovan predmet.");
        }

        $.ajax({
            url: "/subject/deactivate",
            type: "POST",
            data: {
                subject: subject,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Aktivacija predmeta
    $('.subject-activate').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = this.attributes.value.nodeValue;
        if (!subject) {
            return showError("Nije selektovan predmet.");
        }

        $.ajax({
            url: "/subject/activate",
            type: "POST",
            data: {
                subject: subject,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Otvaranja prozora za kreiranje konsultacije
    $('.consult-create-button').click(function () {
        $('#consult-create-subjectval').val(this.attributes.value.nodeValue);
        $('#consult-create').modal('show');
    });

    //Kreiranje zahteva za konsultaciju
    $('#create-constult-submit').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = $('#consult-create-subjectval').val();
        var cons_subject = $('#consult-create-subject').val();
        var date = $('#datetimepicker-create').data('DateTimePicker').date();
        if (!subject || !cons_subject || !date) {
            $('#consult-request').modal('hide');
            return showError("Imate prazna ne popunjena polja.");
        }
        $.ajax({
            url: "/consult/create",
            type: "POST",
            data: {
                subject: subject,
                cons_subject: cons_subject,
                sc_date: date.toDate()
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Odbijanje zahteva
    $('.request-delete-button').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var request = JSON.parse(this.attributes.value.nodeValue);
        var subject = request.subject;
        var student = request.student;
        if (!subject || !student) {
            return showError("Prazno polje");
        }

        $.ajax({
            url: "/consultrequest/reject",
            type: "POST",
            data: {
                subject: subject,
                student: student
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Otvaranja prozora za kreiranje konsultacije po zahtevu
    $('.consult-createrequested-button').click(function () {
        $('#consult-create-requested-request').val(this.attributes.value.nodeValue);
        var request = JSON.parse($('#consult-create-requested-request').val());
        var studentname = request.studentname;
        var reqsubject = request.reqsubject;
        $('#consult-create-requested-studentname').text(studentname);
        $('#consult-create-requested-reqsubject').text(reqsubject);
        $('#consult-create-requested').modal('show');
    });

    //Kreiranje zahteva za konsultaciju
    $('#create-constultrequested-submit').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var request = JSON.parse($('#consult-create-requested-request').val());
        var subject = request.subject;
        var student = request.student;
        var cons_subject = request.reqsubject;
        var date = $('#datetimepicker-create-requested').data('DateTimePicker').date();
        if (!subject || !student || !date || !cons_subject) {
            $('#consult-create-requested').modal('hide');
            return showError("Prazno polje");
        }

        $.ajax({
            url: "/consult/createrequested",
            type: "POST",
            data: {
                subject: subject,
                student: student,
                cons_subject: cons_subject,
                sc_date: date.toDate()
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Student
    |--------------------------------------------------------------------------
    */

    //Deselekcija predmeta
    $('.subject-deselect').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = this.attributes.value.nodeValue;
        if (!subject) {
            return showError("Nije selektovan predmet.");
        }

        $.ajax({
            url: "/subject/deselect",
            type: "POST",
            data: {
                subject: subject,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Selektovanje predmeta studentove godine
    $('#subject-select-onyear-submit').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = $('#subject-select-onyear').val();
        if (!subject) {
            return showError("Nije selektovan predmet.");
        }

        $.ajax({
            url: "/subject/select",
            type: "POST",
            data: {
                subject: subject,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Selektovanje predmeta sa ostalih godina
    $('#subject-select-submit').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = $('#subject-select-val').val();
        if (!subject) {
            return showError("Nije selektovan predmet.");
        }

        $.ajax({
            url: "/subject/select",
            type: "POST",
            data: {
                subject: subject,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Otvaranja prozora za kreiranje zahteva za konsultacije
    $('.consult-request-button').click(function () {
        $('#consult-request-subjectval').val(this.attributes.value.nodeValue);
        $('#consult-request').modal('show');
    });

    //Kreiranje zahteva za konsultaciju
    $('#request-submit').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = $('#consult-request-subjectval').val();
        var req_subject = $('#consult-request-subject').val();
        var date = $('#datetimepicker-request').data('DateTimePicker').date().toDate();
        if (!subject || !req_subject || !date) {
            $('#consult-request').modal('hide');
            return showError("Imate prazna ne popunjena polja.");
        }
        $.ajax({
            url: "/consultrequest/request",
            type: "POST",
            data: {
                subject: subject,
                req_subject: req_subject,
                sc_date: date,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Brisanje zahteva 
    $('.request-delete').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var subject = this.attributes.value.nodeValue;
        if (!subject) {
            return showError("Nije selektovan predmet.");
        }

        $.ajax({
            url: "/consultrequest/delete",
            type: "POST",
            data: {
                subject: subject,
            },
            success: function (result) {
                location.reload();
            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Upravljanje predmetima
    |--------------------------------------------------------------------------
    */

    //Pregled konsultacije u istoriji
    $('.consult_view').click(function () {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/chat");

        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", "consult");
        hiddenField.setAttribute("value", this.attributes.value.nodeValue);
        form.appendChild(hiddenField);

        $('body').append(form);
        form.submit();
    });
    //Klik na dugme za pocinjanje konsultacije
    $('.start_button').click(() => {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/chat");

        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", "consult");
        hiddenField.setAttribute("value", this.activeElement.attributes[4].value);
        form.append(hiddenField);
        $('body').append(form);
        form.submit();
    });

    //Selekcija predmeta iz liste
    $('.select-subject-button').click(function () {
        var subject = this.attributes.value.nodeValue;
        showSubjectTabs();
        $('#subject-' + subject).show();
        $('#subject-history-' + subject).show();
    });

    //Sakriva sve predmete
    function showSubjectTabs()
    {
        userSubjects.forEach(subject => {
            $('#subject-' + subject).hide();
            $('#subject-history-' + subject).hide();
        });
    }

    //-------------------------------------------------------------------------

    
    //Request datetime picker
    $('#datetimepicker-request').datetimepicker({
        daysOfWeekDisabled: [0, 6],
        minDate: new Date(),
        useCurrent: false
    });

    $('#datetimepicker-create').datetimepicker({
        daysOfWeekDisabled: [0, 6],
        minDate: new Date(),
        useCurrent: false
    });

    $('#datetimepicker-create-requested').datetimepicker({
        daysOfWeekDisabled: [0, 6],
        minDate: new Date(),
        useCurrent: false
    });

    //Prikaz neke greske
    function showError(message) {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        $('#error_msg').append('<div class="alert alert-dismissible alert-danger">' +
            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
            '<p>' + message + '</p>' +
            '</div>');
    }
});