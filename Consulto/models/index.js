var fs = require("fs");
var path = require("path");
var Sequelize = require('sequelize');
const Op = Sequelize.Op;

var config = require('config');
var dbconfig = config.get('config.dbconfig');
var sequelize = new Sequelize(dbconfig.dbname, dbconfig.username, dbconfig.password , {
    dialect: 'mysql',
    define: {
        charset: 'utf8mb4'
    },
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

/*
|--------------------------------------------------------------------------
| DEFINISANJE VEZA ZA SEQUELIZE ORM-om
|--------------------------------------------------------------------------
*/
(function (m) {
    //Professorov  slozeni atribut o zabranjenim datumima
    var BlockedDates = sequelize.define('BLOCKED_DATES', {
        date: { type: Sequelize.DATE, allowNull: false, validate: { isDate: true } }
    });
    m['BlockedDates'] = BlockedDates;
    m.BlockedDates.belongsTo(m.Professor, {
        onDelete: 'cascade',
        foreignKey: 'professorId'
    });

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
        foreignKey: 'studentId',
        allowNull: true
    })

    //Professor 1 SALJE n Poruka
    m.Professor.hasMany(m.Message, {
        as: 'Message',
        onDelete: 'cascade',
        foreignKey: 'professorId',
        allowNull: true
    })

    //Student n PRISUSTVUJE m Konsultaciji
    var ConsultAttend = sequelize.define('CONSULT_ATTEND', {
        status: { type: Sequelize.BOOLEAN, defaultValue: false }
    });
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

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
| Klasa koja se koristi za komunikaciju sa bazom
*/
var Storage = function () {
    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */
    //Krejiranje profesora
    this.createProfessor = function (name, email, password, code, callback) {
        models.dbmodels.Professor.findOrCreate({ where: { email: email }, defaults: { name: name, email: email, password: password, confirmCode: code} }).then(professor => {
            callback();
        });
    }
    //Krejiranje studenta
    this.createStudent = function (name, email, password, index, year, code, callback) {
        models.dbmodels.Student.findOrCreate({ where: { email: email }, defaults: { name: name, email: email, password: password, index: index, year: year, confirmCode: code} }).then(student => {
            callback();
        });
    }
    //Kreira zabaranjen datum za professora
    this.createBlockedDate = function (professor, date, callback) {
        models.dbmodels.BlockedDates.findOrCreate({ where: { date: date }, defaults: {date: date, professorId: professor} }).then(blockedDate => {
            callback(blockedDate);
        });
    }

    //Nalazi korisnika po emailu
    this.findProfessorByEmail = function (email, callback) {
        models.dbmodels.Professor.findOne({ where: { email: email } }).then(professor => {
            callback(professor);
        });
    }
    this.findStudentByEmail = function (email, callback) {
        models.dbmodels.Student.findOne({ where: { email: email } }).then(student => {
            callback(student);
        });
    }
    this.findUserByEmail = function (email, callback) {
        this.findProfessorByEmail(email, professor => {
            if (professor == null)
                this.findStudentByEmail(email, student => {
                    callback(student, "student");
                });
            else
                callback(professor, "professor");
        });
    }

    //Proovera da li je index u upotrebi
    this.checkIsIndexInUse = function (index, callback) {
        models.dbmodels.Student.findOne({ where: { index: index }}).then(student => {
            if (student)
                callback(true);
            else
                callback(false);
        });
    }

    //Stavlja status na confirmed ako je korisnik potvrdio svoj nalog
    this.userConfirmed = function (email, user_type, callback) {
        if (user_type == 'professor')
            models.dbmodels.Professor.findOne({ where: { email: email } }).then(professor => {
                professor.update({ confirmed: true }).then(() => {
                    callback();
                });
            });
        else if(user_type == 'student')
            models.dbmodels.Student.findOne({ where: { email: email } }).then(student => {
                student.update({ confirmed: true }).then(() => {
                    callback();
                });
            });
    }

    //Brise sve korisnike koji nisu potvrdili svoj status u roku od 24h 
    this.deleteUnconfirmedUsers = function (callback) {
        //Vreme pre 24 sata
        var date = new Date(new Date().toString() + sequelize.options.timezone) - 24 * 60 * 60 * 1000;
        var date = new Date(date);
        models.dbmodels.Professor.destroy({ where: { createdAt: { [Op.lt]: date, confirmed: false} } }).then(function () {
            models.dbmodels.Student.destroy({ where: { createdAt: { [Op.lt]: date, confirmed: false } } }).then(function () {
                callback();
            });
        });
    }
    //Uklanja zabranjeni datum za profesora
    this.deleteBlockedDate = function (professor, date, callback) {
        models.dbmodels.BlockedDates.destroy({ where: {professorId: professor, date: date}}).then(function () {
            callback();
        });
    }
    /*
    |--------------------------------------------------------------------------
    | SUBJECT
    |--------------------------------------------------------------------------
    */
    //Krejira predmet za profesora
    this.createSubject = function (professor, name, year, callback) {
        models.dbmodels.Professor.findById(professor.id).then(professor => {
            models.dbmodels.Subject.findOrCreate({ where: { name: name }, defaults: { name: name, year: year, professorId: professor.id } }).then(subject => {
                callback(subject);
            });
        });
    }
    //Selektuje predmet za studenta
    this.selectSubjectForStudent = function (student, subjectId, callback) {
        models.dbmodels.Student.findById(student.id).then(student => {
            student.addListen(subjectId, { through: models.dbmodels.StudentSubject }).then(() => {
                callback();
            });
        });
    }

    //Nalazi predmet po id-u
    this.findSubjecById = function (subject, callback) {
        models.dbmodels.Subject.findById(subject).then(subject => {
            callback(subject);
        });
    }
    //Nalazi profesora za studenta
    this.findSubjectProfessor = function (subject, callback) {
        models.dbmodels.Subject.findById(subject).then(subject => {
            models.dbmodels.Professor.findById(subject.professorId).then(professor => {
                callback(professor);
            });
        });
    }
    //Nalazi predmete za profesora
    this.findProfessorSubjects = function (professor, callback) {
        models.dbmodels.Professor.findById(professor.id).then(professor => {
            models.dbmodels.Subject.findAll({ where: { professorId: professor.id }, order: [['name', 'ASC']] }).then(subjects => {
                callback(subjects);
            });
        });
    }
    //Nalazi sve predemte koje slusa student
    this.findStudentSubjects = function (student, callback) {
        models.dbmodels.Student.findById(student.id).then(student => {
            student.getListen({ include: [{ model: models.dbmodels.Professor, required: true }], order: [['name', 'ASC']] }).then(subjects => {
                callback(subjects);
            });
        });
    }
    //Nalazi sve predmete
    this.findAllSubjects = function (callback) {
        models.dbmodels.Subject.findAll({ order: ['name'] }).then(subjects => {
            callback(subjects);
        });
    }
    //Nalazi sve konsultacije za predmet
    this.findSubjectConsults = function (subject, callback) {
        models.dbmodels.Consult.findAll({ where: { subjectId: subject.id }, order: [['s_time', 'ASC']] }).then(consults => {
            callback(consults);
        });
    }
    //Nalazi sve zahteve za dati predmet
    this.findSubjectConsultRequests = function (subject, callback) {
        models.dbmodels.ConsultRequest.findAll({ where: { subjectId: subject.id } }).then(requests => {
            promises = [];
            requests.forEach(request => {
                promises.push(new Promise((resolve, reject) => {
                    models.dbmodels.Student.findById(request.studentId).then(student => {
                        request.student = student;
                        resolve(request);
                    });
                }));
            });
            Promise.all(promises).then(consults => {
                callback(requests);
            });
        });
    }
    //Nalazi blokirane datume za predmet
    this.findSubjectBlockedDates = function (subject, callback) {
        //TODO: zavrsi
    }

    //Promena statusa na neaktivan
    this.subjectOff = function (subject, callback) {
        models.dbmodels.Subject.findById(subject).then(subject => {
            if (subject != null)
                subject.update({ status: false }).then(() => {
                    callback();
                });
            else
                callback();
        });
    }
    //Promena statusa predmeta na aktivan
    this.subjectOn = function (subject, callback) {
        models.dbmodels.Subject.findById(subject).then(subject => {
            if (subject != null)
                subject.update({ status: true }).then(() => {
                    callback();
                });
            else
                callback();
        });
    }


    //Deselektuje predmet za studenta
    this.deselectSubjectForStudent = function (student, subjectId, callback) {
        models.dbmodels.Student.findById(student.id).then(student => {
            student.removeListen(subjectId, { through: models.dbmodels.StudentSubject }).then(() => {
                callback();
            });
        });
    }
    /*
    |--------------------------------------------------------------------------
    | CONSULT
    |--------------------------------------------------------------------------
    */

    //Pravi konsultaciju za predmet i profesora
    this.createConsult = function (subject, csubject, scTime, callback) {
        models.dbmodels.Consult.create({ subject: csubject, sc_time: scTime, subjectId: subject }).then(() => {
            callback();
        });
    }
    //Zahteva konsultaciju za predmet
    this.requestConsult = function (student, subjectId, subject, time, callback) {
        models.dbmodels.ConsultRequest.findOrCreate({ where: { studentId: student.id, subjectId: subjectId }, defaults: { status: 'notApproved', subject: subject, time: time, studentId: student.id, subjectId: subjectId } }).then(request => {
            callback();
        });
    }
    //Student se prikljucio konsultaciji
    this.studentJoinedConsult = function (student, consult, callback) {
        models.dbmodels.ConsultAttend.findOrCreate({ where: { studentId: student, consultId: consult }, defaults: { status: true, studentId: student, consultId: consult } }).then(attend => {
            if (attend == null)
                callback();
            attend[0].update({ status: true }).then(() => {
                callback();
            });
        });
    }

    //Nalazi konsultaciju po idu
    this.findConsultById = function (consult, callback) {
        models.dbmodels.Consult.findById(consult).then(consult => {
            callback(consult);
        });
    }
    //Pronalazi studentov zahtev za dati predmet
    this.findStudentConsultRequest = function (student, subjectId, callback) {
        models.dbmodels.ConsultRequest.findAll({ where: { studentId: student.id, subjectId: subjectId }, order: [['time', 'ASC']] }).then(request => {
            if (request[0] == undefined)
                callback(null);
            else
                callback(request[0]);
        });
    }
    //Pronalazi sve poruke za konsultaciju
    this.findConsultMessages = function (consult, callback) {
        models.dbmodels.Message.findAll({ where: { consultId: consult.id } }).then(messages => {
            promises = [];
            messages.forEach(message => {
                promises.push(new Promise((resolve, reject) => {
                    models.dbmodels.Student.findById(message.studentId).then(student => {
                        message.student = student;
                        message.professor = null;
                        resolve(student);
                    });
                }));
            });
            Promise.all(promises).then(students => {
                promises = [];
                messages.forEach(message => {
                    promises.push(new Promise((resolve, reject) => {
                        models.dbmodels.Professor.findById(message.professorId).then(professor => {
                            message.professor = professor;
                            resolve(professor);
                        });
                    }));
                });
                Promise.all(promises).then(professors => {
                    callback(messages);
                });
            });
        });
    }
    //Pronalazi predmet za datu konsultaciju
    this.findConsultSubject = function (consult, callback) {
        models.dbmodels.Subject.findById(consult.subjectId).then(subject => {
            callback(subject);
        });
    }
    //Praonalazi porfesora za datu konsultaciju
    this.findConsultProfessor = function (consult, callback) {
        models.dbmodels.Subject.findById(consult.subjectId).then(subject => {
            models.dbmodels.Professor.findById(subject.professorId).then(professor => {
                callback(professor);
            });
        });
    }
    //Pronalazi sve sutdente koji su prisutni na konsultaciji
    this.findConsultStudents = function (consult, callback) {
        models.dbmodels.Consult.findById(consult.id).then(consult => {
            consult.getAttend().then(students => {
                callback(students);
            });
        });
    }
    //Nalazi konsultaciju sa najmanjim zakazanim vremenom a koja nije pocela ili se zavrsila
    this.findNextConsultForNotification = function (callback) {
        var date = new Date(new Date().toString() + sequelize.options.timezone);
        var date = new Date(date);
        models.dbmodels.Consult.min('sc_time', { where: { sc_time: { [Op.gte]: date}}, s_time: null, e_time: null}).then(mindate => {
            models.dbmodels.Consult.findOne({ where: { sc_time: mindate } }).then(consult => {
                callback(consult);
            });
        });
    }

    //Pocinje konsultaciju
    this.startConsult = function (consult, callback) {
        models.dbmodels.Consult.findById(consult).then(consult => {
            var date = new Date();
            consult.update({ s_time: new Date(date.toString() + sequelize.options.timezone), status: true }).then(() => {
                callback();
            });
        });
    }
    //Profesor je prisutan na konsultaciji
    this.professorJoinedConsult = function (consult, callback) {
        models.dbmodels.Consult.findById(consult).then(consult => {
            consult.update({ status: true }).then(() => {
                callback();
            });
        });
    }
    //Profesor je napustio konsultaciju ali je nije zavrsio
    this.professorLeftConsult = function (consult, callback) {
        models.dbmodels.Consult.findById(consult).then(consult => {
            consult.update({ status: false }).then(() => {
                callback();
            });
        });
    }
    //Student se odjavio sa konsultacije
    this.studentLeftConsult = function (student, consult, callback) {
        models.dbmodels.ConsultAttend.findOne({ where: { studentId: student, consultId: consult } }).then(attend => {
            if (attend == null)
                callback();
            else
                attend.update({ status: false }).then(() => {
                    callback();
                });
        });
    }
    //Zavrsava konsultaciju
    this.endConsult = function (consult, callback) {
        models.dbmodels.Consult.findById(consult).then(consult => {
            var date = new Date();
            consult.update({ e_time: new Date(date.toString() + sequelize.options.timezone), status: false }).then(() => {
                models.dbmodels.Consult.findById(consult.id).then(consult => {
                    consult.getAttend().then(students => {
                        promises = [];
                        students.forEach(student => {
                            promises.push(new Promise((resolve, reject) => {
                                models.dbmodels.ConsultAttend.findOne({ where: { studentId: student.id, consultId: consult.id } }).then(attend => {
                                    if (attend == null)
                                        resolve();
                                    else
                                        attend.update({ status: false }).then(() => {
                                            resolve();
                                        });
                                });
                            }));
                        });
                        Promise.all(promises).then(() => {
                            callback();
                        });
                    });
                });
            });
        });
    }
    //Odobrava zahtev za konsultaciju
    this.approvedConsultRequest = function (student, subjectId, callback) {
        models.dbmodels.ConsultRequest.findAll({ where: { studentId: student.id, subjectId: subjectId }, order: [['time', 'ASC']] }).then(request => {
            if (request[0] == undefined)
                callback(null);
            else
                request[0].update({ status: 'approved'}).then(() => {
                    callback();
                });
        });
    }
    //Odbija konsultaciju
    this.rejectedConsultRequest = function (student, subjectId, callback) {
        models.dbmodels.ConsultRequest.findOne({ where: { studentId: student, subjectId: subjectId }}).then(request => {
            if (!request)
                callback(null);
            else
                request.update({ status: 'rejected' }).then(() => {
                    callback();
                });
        });
    }
    //Brise zahtev za konsultaciju
    this.deleteConsultRequest = function (student, subject, callback) {
        models.dbmodels.ConsultRequest.findOne({ where: { studentId: student, subjectId: subject } }).then(request => {
            request.destroy({ force: true }).then(() => {
                callback();
            });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE
    |--------------------------------------------------------------------------
    */
    //Krejira poruku za studenta
    this.createMessageStudent = function (content, consult, student, callback) {
        models.dbmodels.Message.create({ content: content, consultId: consult, studentId: student }).then(message => {
            callback();
        });
    }
    //Krejira poruku za profesora
    this.createMessageProfessor = function (content, consult, professor, callback) {
        models.dbmodels.Message.create({ content: content, consultId: consult, professorId: professor }).then(message => {
            callback();
        });
    }
};

models.Storage = new Storage();
models.sequelize = sequelize;
module.exports = models;
