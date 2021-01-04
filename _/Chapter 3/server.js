/*jslint node: true, es5: true, nomen: true, sloppy: true */
var express = require('express');
var path    = require('path');
var Bourne  = require("bourne");

var app = express();
var db  = new Bourne("db/events.json");

app.configure(function () {
    "use strict";
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));
});

app.get("/events", function (req, res) {
    db.find(function (err, events) {
        res.json(events);
    });
});

app.post("/events", function (req, res) {
    var attrs = {
        title: req.body.title,
        details: req.body.details,
        date: req.body.date,
        createdOn: new Date()
    };
    
    db.insert(attrs, function (err, event) {
        res.json(event);
    });
});

app.put("/events/:id", function (req, res) {
    var e = {
        title: req.body.title,
        details: req.body.details,
        date: req.body.date
    };
    
    db.update({ id: parseInt(req.params.id, 10) }, e, function (err, e) {
        res.json(e);
    });
});

app.delete("/events/:id", function (req, res) {
    db.delete({ id: parseInt(req.params.id, 10) }, function () {
        res.json({});
    });
});

app.get('/*', function (req, res) {
    db.find(function (err, events) {
        res.render("index.ejs", { events: JSON.stringify(events) });
    });
});

app.listen(3000);
