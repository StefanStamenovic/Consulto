$(document).ready(function () {
    $("#student").click(function () {
        $("#choice").hide();
        $("#signup-student").show();
        window.history.pushState('forward', null, '');
    });

    $("#professor").click(function () {
        $("#choice").hide();
        $("#signup-professor").show();
        window.history.pushState('forward', null, '');
    });

    $(window).on('popstate', function () {
        location.reload();
    });
});