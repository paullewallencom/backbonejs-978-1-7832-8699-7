/*jslint node: true, sloppy: true */
var bcrypt        = require("bcrypt");
var LocalStrategy = require("passport-local").Strategy;

var salt = bcrypt.genSaltSync(10);

exports.hashPassword = function (password) {
    return bcrypt.hashSync(password, salt);
};

exports.strategy = function (db) {
    return new LocalStrategy(function (username, password, done) {
        db.findOne({ username: username }, function (err, user) {
            if (!user) {
                done(null, false, { message: "Incorrect username." });
            } else if (!bcrypt.compareSync(password, user.passwordHash)) {
                done(null, false, { message: "Incorrect password." });
            } else {
                done(null, user);
            }
        });
    });
};

exports.serialize = function (user, done) {
    done(null, user.id);
};

exports.deserialize = function (db) {
    return function (id, done) {
        db.findOne({ id: id }, function (err, user) {
            done(null, user);
        });
    };
};
