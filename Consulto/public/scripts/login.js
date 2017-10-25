$(document).ready(function () {
    var femail;
    var fpassword;

    //Povracaj iz pogleda restrartuje stranicu
    $(window).on('popstate', function () {
        location.reload();
    });

    //Logovanje korisnika
    $("#login-button").click(function () {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        var email = $('#email').val();
        var password = $('#password').val();
        if (!email || !password)
            return showError("Imate prazna ne popunjena polja.");
        if (!(/^\w+([\.-]?\w+)*@elfak.rs|elfak.ni.ac.rs/.test(email)))
            return showError("Nevalidna email adresa, dozvoljeni domeni su @elfak.rs i @elfak.ni.ac.rs.");
        if (password.length < 5)
            return showError("Sifra je prekratka.");
        $.ajax({
            url: "/login",
            type: "POST",
            data: {
                email: email,
                password: password
            },
            success: function (result) {
                while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
                if (result.login == true && result.confirmed == true)
                    window.location.href = "/dashboard";
                if (!result.confirmed)
                {
                    femail = email;
                    fpassword = password;
                    $("#login-view").hide();
                    window.history.pushState('forward', null, '');
                    $("#confirm-code").show();
                }
                else if (!result.login)
                    showError("Pogresan email ili sifra.");

            },
            error: function (err) {
                showError(err.responseJSON);
            }
        });
    });

    //Logovanje posle potvrde nepotvrdjenog naloga
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
                                if (!result.login || !result.confirmed)
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

    //Prikaz neke greske
    function showError(message) {
        while ($('#error_msg').children().length) $('#error_msg').children()[$('#error_msg').children().length - 1].remove();
        $('#error_msg').append('<div class="alert alert-dismissible alert-danger">' +
            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
            '<p>' + message + '</p>' +
            '</div>');
    }
});