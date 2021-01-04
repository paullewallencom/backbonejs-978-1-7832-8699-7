/*jslint node: true, es5: true, nomen: true */
var express  = require('express');
var path     = require('path');
var Bourne   = require("bourne");
var passport = require("passport");
var signin   = require("./signin");
var Podcasts = require('./podcasts');
var app      = express();
var users    = new Bourne("users.json");

app.configure(function () {
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.multipart());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'podcast-application' }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static('public'));
});

passport.use(signin.strategy(users));
passport.serializeUser(signin.serialize);
passport.deserializeUser(signin.deserialize(users));

app.get("/login", function (req, res) {
    res.render("login.ejs");
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/create', function (req, res, next) {
    var userAttrs = {
        username: req.body.username,
        passwordHash: signin.hashPassword(req.body.password)
    };
    users.findOne({ username: userAttrs.username }, function (err, existingUser) {
        if (!existingUser) {
            users.insert(userAttrs, function (err, user) {
                req.login(user, function (err) {
                    res.redirect("/");
                });
            });
        } else {
            res.redirect("/");
        }
    });
});

app.post('/podcasts', function (req, res) {
    var podcast = req.user.podcasts.get(req.body.feed);
    podcast.info.then(res.json.bind(res));
});

app.get('/podcasts/:id/episodes', function (req, res) {
    var podcast = req.user.podcasts.get(parseInt(req.params.id, 10));
    podcast.update().then(res.json.bind(res));
});

app.put('/episode/:id', function (req, res) {
    req.user.podcasts.updateEpisode(parseInt(req.params.id, 10), req.body, function (err, data) {
        res.json(data);  
    });
});

app.get('/*', function (req, res) {
    if (!req.user) {
        res.redirect("/login");
        return;
    }
    req.user.podcasts = new Podcasts(req.user.id);
    req.user.podcasts.all().then(function (records) {
        res.render('index.ejs', { 
            podcasts: JSON.stringify(records),
            username: req.user.username
        });
    });
});

app.listen(3000);
