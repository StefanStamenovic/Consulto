$(document).ready(function () {
    var socket = io();
    //Klik na dugme za zahtev za konsultacijom
    $('.requestButton').click(function () {
        $('#request_subject').val(this.value);
        var date = new Date();
        $('#req_date_days').val(date.getUTCDate());
        $('#req_date_months').val(date.getUTCMonth());
        $('#makeRequest').modal('show');
    });
    //Klik na dugme za krejiranje konsultacije
    $('.consult_create').click(function () {
        $('#request_subject').val(this.value);
        var date = new Date();
        $('#req_date_hours').val(date.getHours());
        $('#req_date_minutes').val(date.getUTCMinutes());
        $('#req_date_days').val(date.getUTCDate());
        $('#req_date_months').val(date.getUTCMonth());
        $('#createSingleConsult').modal('show');
    });
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

        this.append(form);
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
    //Klik na dugme za odjavu predmeta
    $('.deselect_button').click(() => {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/subject/deselect");

        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", "subject");
        hiddenField.setAttribute("value", this.activeElement.attributes[4].value);
        form.append(hiddenField);
        $('body').append(form);
        form.submit();
    });
    //Klik na dugme za gasenje predmeta
    $('.subject_off').click(() => {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/subject/deactive");

        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", "subject");
        hiddenField.setAttribute("value", this.activeElement.attributes[4].value);
        form.append(hiddenField);
        $('body').append(form);
        form.submit();
    });
    //Klik na dugme za gasenje predmeta
    $('.subject_on').click(() => {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/subject/active");

        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", "subject");
        hiddenField.setAttribute("value", this.activeElement.attributes[4].value);
        form.append(hiddenField);
        $('body').append(form);
        form.submit();
    });
    //Klik na dugme za brisanje zahteva
    $('.request_delete').click(() => {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/request/delete");

        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", "subject");
        hiddenField.setAttribute("value", this.activeElement.attributes[4].value);
        form.append(hiddenField);
        var hiddenField1 = document.createElement("input");
        hiddenField1.setAttribute("type", "hidden");
        hiddenField1.setAttribute("name", "student");
        hiddenField1.setAttribute("value", this.activeElement.attributes[5].value);
        form.append(hiddenField1);
        $('body').append(form);
        form.submit();
    });
    //Klik na dugme za krejiranje zahteva
    $('#request_button').click(() => {
        socket.emit('consult request', {});
    });
});