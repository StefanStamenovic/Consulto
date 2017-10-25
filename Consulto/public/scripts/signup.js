$(document).ready(function () {
    var femail;
    var fpassword;
    //Odabir studenta za registraciju
    $("#student").click(function () {
        $("#choice").hide();
        $("#signup-student").show();
        window.history.pushState('forward', null, '');
    });

    //Odabir profesora za registraciju
    $("#professor").click(function () {
        $("#choice").hide();
        $("#signup-professor").show();
        window.history.pushState('forward', null, '');
    });

    //Povracaj iz pogleda restrartuje stranicu
    $(window).on('popstate', function () {
        location.reload();
    });

    //Registracija studenta
    $('#reguister-student').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var name = $('#student-name').val();
        var email = $('#student-email').val();
        var password = $('#student-password').val();
        var confirm_password = $('#student-confirm-password').val();
        var index = $('#student-index').val();
        var year = $('#student-year').val();

        if (!name || !email || !password || !confirm_password || !index || !year)
            return showError("Imate prazna ne popunjena polja.");
        if (!(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
            return showError("Nevalidna email adresa, dozvoljeni domeni su @elfak.rs i @elfak.ni.ac.rs.");
        if (password.length < 5)
            return showError("Sifra je prekratka.");
        if (password != confirm_password)
            return showError("Ne poklapaju se sifre.");
        if (year < 0 || year > 5)
            return showError("Nevalidna vrednost godine, validen vrednosti su od 1-5");
        $.ajax(
            {
                url: "/signup/student",
                type: "POST",
                data: {
                    name: name,
                    email: email,
                    password: password,
                    index: index,
                    year: year
                },
                success: function () {
                    while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
                    $("#signup-student").hide();
                    $("#confirm-code").show();
                    femail = email;
                    fpassword = password;
                },
                error: function (err) {
                    showError(err.responseJSON);
                }
            });
    });

    //Registracija profesora
    $('#reguister-professor').click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var name = $('#professor-name').val();
        var email = $('#professor-email').val();
        var password = $('#professor-password').val();
        var confirm_password = $('#professor-confirm-password').val();

        if (!name || !email || !password || !confirm_password)
            return showError("Imate prazna ne popunjena polja.");
        if (!(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
            return showError("Nevalidna email adresa, dozvoljeni domeni su @elfak.rs i @elfak.ni.ac.rs.");
        if (password.length < 5)
            return showError("Sifra je prekratka.");
        if (password != confirm_password)
            return showError("Ne poklapaju se sifre.");
        $.ajax(
            {
                url: "/signup/professor",
                type: "POST",
                data: {
                    name: name,
                    email: email,
                    password: password
                },
                success: function () {
                    while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
                    $("#signup-professor").hide();
                    $("#confirm-code").show();
                    femail = email;
                    fpassword = password;
                },
                error: function (err) {
                    showError(err.responseJSON);
                }
            });
    });

    //Ponovo slanje aktivacionog koda
    $("#code-resend-button").click(function () {
        $.ajax(
            {
                url: "/login/resendcq",
                type: "POST",
                data: {
                    email: femail,
                },
                success: function () {
                    while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
                    $("#signup-professor").hide();
                    $("#confirm-code").show();
                },
                error: function (err) {
                    showError(err.responseJSON);
                }
            });
    });

    //Provera aktivacionog koda i logovanje ako je uspesno
    $("#confirm-button").click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var confcode = $('#confcode').val();
        if (!confcode)
            return showError("Polje za kod nesme biti prazano.");
        $.ajax(
            {
                url: "/login/confirm",
                type: "POST",
                data: {
                    email: femail,
                    confcode: confcode
                },
                success: function (result) {
                    while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
                    if (result == true)
                        $.ajax({
                                url: "/login",
                                type: "POST",
                                data: {
                                    email: femail,
                                    password: fpassword
                                },
                                success: function (result) {
                                    while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
                                    if (result.login == true && result.confirmed == true)
                                        window.location.href = "/dashboard";
                                    if(!result.login || !result.confirmed)
                                        showError("Greska prilikom logaovanja.");
                        
                                },
                                error: function (err) {
                                    showError(err.responseJSON);
                                }
                            });
                    else
                        showError("Aktivacioni kod nije tacan.");
                },
                error: function (err) {
                    showError(err.responseJSON);
                }
            });
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