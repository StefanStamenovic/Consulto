var fs = require("fs");
var path = require("path");
var Sequelize = require('sequelize');
6
var config = require('config');
var dbconfig = config.get('config.dbconfig');
var sequelize = new Sequelize(dbconfig.dbname, dbconfig.username, dbconfig.password , {
    dialect: 'mysql'
});

var models = {
    dbmodels: {},
    viewmodels: {}
};

//Ukljucivanje modela baze
fs.readdirSync(__dirname + '/dbmodels').filter(function (file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
}).forEach(function (file) {
    var lmodel = sequelize.import(path.join(__dirname + '/dbmodels/', file));
    models.dbmodels[lmodel.name.charAt(0) + lmodel.name.slice(1).toLowerCase()] = lmodel;
    });

//Ukljucivanje view modela

//Veze
//-----------------------------------------------------------------------------
(function (m) {
    //Konsultacija 1 SADRZI n poruka
    m.Message.belongsTo(m.Consult)

    //Profesor 1 ZAKAZUJE n konsultacija
    m.Consult.belongsTo(m.Professor);

    //Profesor 1 DRZI n Predmet
    m.Subject.belongsTo(m.Professor);

    //Student n ZAHTEVA_KONSULTACIJU 1 Predmet
    var ConsultRequest = sequelize.define('CONSULT_REQUEST', {
        time: { type: Sequelize.DATE, allowNull: false, validate: { isDate: true } }
    });
    m['ConsultRequest'] = ConsultRequest;
    m.Student.belongsToMany(m.Subject, { through: ConsultRequest })

    //Student 1 SALJE n Poruka i  Profesor 1 SALJE n Poruka
    m.Student.hasMany(m.Message);
    m.Professor.hasMany(m.Message);

    //Student n PRISUSTVUJE m Konsultaciji
    m.Consult.belongsToMany(m.Student, { through: 'Attend' });
})(models.dbmodels);

models.sequelize = sequelize;

module.exports = models;
