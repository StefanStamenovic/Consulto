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
    viewmodels: {},
    Storage: {}
};

//Ukljucivanje modela baze
fs.readdirSync(__dirname + '/dbmodels').filter(function (file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
}).forEach(function (file) {
    var lmodel = sequelize.import(path.join(__dirname + '/dbmodels/', file));
    models.dbmodels[lmodel.name.charAt(0) + lmodel.name.slice(1).toLowerCase()] = lmodel;
    });

//Ukljucivanje view modela
fs.readdirSync(__dirname + '/viewmodels').filter(function (file) {
    return (file.indexOf(".") !== 0) && (file !== "viewmodel.js");
}).forEach(function (file) {
    var lmodel = require(path.join(__dirname + '/viewmodels/', file));
    models.viewmodels[file.charAt(0).toUpperCase() + file.slice(1,-3).toLowerCase()] = lmodel;
});
//Veze
//-----------------------------------------------------------------------------
(function (m) {
    //Profesor 1 PREDAJE n Predmet
    m.Professor.hasMany(m.Subject, {
        as: 'Subject',
        onDelete: 'cascade',
        foreignKey: 'professorId'
    });
    m.Subject.belongsTo(m.Professor, {
        onDelete: 'cascade',
        foreignKey: 'professorId'
    });
    //Profesor 1 DRZI n Konsultacija
    m.Professor.hasMany(m.Consult, {
        as: 'Consult',
        onDelete: 'cascade',
        foreignKey: 'professorId'
    });

    //Konsultacija n ZA 1 Predmet
    m.Subject.hasMany(m.Consult, {
        as: 'Consult',
        onDelete: 'cascade',
        foreignKey: 'subjectId'
    });

    //Student n ZAHTEVA 1 Predmet 1 Konsultacija
    var ConsultRequest = sequelize.define('CONSULT_REQUEST', {
        status: { type: Sequelize.ENUM('notApproved', 'approved', 'rejected'), allowNull: false },
        subject: { type: Sequelize.STRING, allowNull: false },
        time: { type: Sequelize.DATE, allowNull: false, validate: { isDate: true } }
    });
    m['ConsultRequest'] = ConsultRequest;
    m.Student.belongsToMany(m.Subject, {
        as: 'Request',
        through: ConsultRequest,
        onDelete: 'cascade',
        foreignKey: 'studentId',
        otherKey: 'subjectId'
    });
    m.ConsultRequest.belongsTo(m.Consult, {
        onDelete: 'cascade',
        foreignKey: {
            name: 'consultId',
            allowNull: true
        }
    });

    //Konsultacija 1 SADRZI n poruka
    m.Consult.hasMany(m.Message, {
        as: 'Message',
        onDelete: 'cascade',
        foreignKey: 'consultId'
    });

    //Sudent 1 SALJE n Poruka
    m.Student.hasMany(m.Message, {
        as: 'Message',
        onDelete: 'cascade',
        foreignKey: 'userId'
    })

    //Professor 1 SALJE n Poruka
    m.Professor.hasMany(m.Message, {
        as: 'Message',
        onDelete: 'cascade',
        foreignKey: 'userId'
    })

    //Student n PRISUSTVUJE m Konsultaciji
    var ConsultAttend = sequelize.define('CONSULT_ATTEND', {});
    m['ConsultAttend'] = ConsultAttend;
    m.Consult.belongsToMany(m.Student, {
        as: 'Attend',
        through: ConsultAttend,
        onDelete: 'cascade',
        foreignKey: 'consultId',
        otherKey: 'studentId'
    });

    //Sudent n SLUSA m Predmeta
    var StudentSubject = sequelize.define('STUDENT_SUBJECT', {});
    m['StudentSubject'] = StudentSubject;
    m.Student.belongsToMany(m.Subject, {
        as: 'Listen',
        through: StudentSubject,
        onDelete: 'cascade',
        foreignKey: 'studentId',
        otherKey: 'subjectId'
    });

})(models.dbmodels);

models.Storage = function () {

    //User
//-----------------------------------------------------------------------------
    //Nalazi korisnika po emailu
    this.findUserByEmail = function(email,callback){
        models.dbmodels.Professor.findOne({ where: { email: email } }).then(professor => {
            if (professor == null)
                models.dbmodels.Student.findOne({ where: { email: email } }).then(student => {
                    callback(student, "student");
                });
            else
                callback(professor, "professor");
        });
    }
    //Kreira korisnika u bazi
    this.createUser = function (user_type, name, email, hashPassword, index, year) {
        if (user_type == "professor") {
            models.dbmodels.Professor.findOrCreate({ where: { email: email }, defaults: { name: name, email: email, password: hashPassword } });
        }
        else if (user_type == "student")
            models.dbmodels.Student.findOrCreate({ where: { email: email }, defaults: { name: name, email: email, password: hashPassword, index: index, year: year } });
    }

    //Subject
//-----------------------------------------------------------------------------
    //Krejira predmet za profesora
    this.createSubject = function (professor, name, year, callback) {
        models.dbmodels.Professor.findById(professor.id).then(professor => {
            models.dbmodels.Subject.findOrCreate({ where: {name: name}, defaults: { name: name, year: year }}).then(subject => {
                professor.addSubject(subject).then(() => {
                    callback();
                });
            });
        });
    }
    //Promeniti status predmeta na neaktivan za profesora
    this.checkOutSubject = function (professor, subjectName, status, callback) {
        models.dbmodels.Subject.findOne({ name: subjectName, professorId: professor.id }).then(subject => {
            if (subject != null)
                subject.update({ status: status }).then(() => {
                    callback();
                });
        });
    }

    //Nalazi predmete za profesora
    this.findProfessorSubjects = function (professor, callback) {
        models.dbmodels.Professor.findById(professor.id).then(professor => {
            professor.getSubject().then(subjects => {
                callback(subjects);
            });
        });
    }

    //Nalazi sve predemte koje slusa student
    this.findStudentSubjects = function (student, callback) {
        models.dbmodels.Student.findById(student.id).then(student => {
            student.getListen({ include: [{model: models.dbmodels.Professor, required: true}]}).then(subjects => {
                callback(subjects);
            });
        });
    }
    //Nalazi sve predmete
    this.findAllSubjects = function (callback) {
        models.dbmodels.Subject.findAll({order: ['name'] }).then(subjects => {
            callback(subjects);
        });
    }

    //Selektuje predmet za studenta
    this.selectSubjectForStudent = function(student, subjectId,callback)
    {
        models.dbmodels.Student.findById(student.id).then(student => {
            student.addListen(subjectId, { through: models.dbmodels.StudentSubject}).then(() => {
                callback();
            });
        });
    }

    //Consult
//-----------------------------------------------------------------------------
    //Pravi konsultaciju za predmet i profesora
    this.createConsult = function (professor, subjectName, csubject, scheduledTime, callback) {
        models.dbmodels.Subject.findOne({ where: { name: subjectName } }).then(subject => {
            models.dbmodels.Consult.create({ subject: csubject, sc_time: scheduledTime, professorId: professor.id, subjectId: subject.id }).then(() => {
                callback();
            });
        });
    }
    //Pocinje konsultaciju
    this.beginConsult = function (professor, subjectName, consultId, callback) {
        models.dbmodels.Consult.findOne({ where: { id: consultId } }).then(consult => {
            consult.update({ s_time: new Date(), status: true }).then(() => {
                callback();
            });
        });
    }
    //Zavrsava konsultaciju
    this.finishConsult = function (professor, subjectName, consultId, callback) {
        models.dbmodels.Consult.findOne({ where: { id: consultId } }).then(consult => {
            consult.update({ e_time: new Date(), status: false }).then(() => {
                callback();
            });
        });
    }
    //Zahteva konsultaciju za predmet
    this.requestConsult = function (student, subjectId, subject, time, callback) {
        models.dbmodels.ConsultRequest.create({ status: 'notApproved', subject: subject, time: time, studentId: student.id, subjectId: subjectId }).then(() => {
            callback();
        });
    }
    //Brise zahtev za konsultaciju
    this.deleteConsultRequest = function (studen, cosultReqId) {
        models.dbmodels.ConsultRequest.destroj({ where: { studentId: student.id, id: consultReqId } });
    }
    //Krejira konsultaciju za date zahteve
    this.createConsultFromRequests = function (professor, subjectName, csubject, scheduledTime, consultReqIds, callback) {
        models.dbmodels.Subject.findOne({ where: { name: subjectName } }).then(subject => {
            models.dbmodels.Consult.create({ subject: csubject, sc_time: scheduledTime, professorId: professor.id, subjectId: subject.id }).then(consult => {
                var consReqArr = [];
                consultReqIds.forEach(function (consReqId) {
                    consReqArr.push({ id: consReqId });
                });
                models.dbmodels.ConsultRequest.bulkCreate(consReqArr).then(() => {
                    return ConsultRequest.update({ consultId: consult.id});
                }).then(() => {
                    callback();
                });
            });
        });
    }

    this.test = function (callback) {
        models.dbmodels.Student.create({ email: 'student@gmail.com', name: 'Student Studentic', password: 1, year: 4, index: 1 }).then(student => {
            student.addSUBJECT();
        });
        callback();
    }
}


models.sequelize = sequelize;
module.exports = models;
