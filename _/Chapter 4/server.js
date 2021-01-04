/*jslint node: true, es5: true, nomen: true */
var express = require('express');
var path    = require('path');
var Bourne  = require("bourne");

var app = express();
var db  = new Bourne("data.json");

app.configure(function () {
    "use strict";
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));
});

app.post('/events', function (req, res) {
    var b = req.body;
    db.insert({
        title: b.title,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime
    }, function (evt) {
        res.json(evt);
    });
});

app.delete('/events/:id', function (req, res) {
    var id = parseInt(req.params.id, 10);

    db.delete({ id: id }, function () {
        res.json({});
    });
});

app.get('/*', function (req, res) {
    "use strict";
    db.find(function (events) {
        res.render("index.ejs", { events: JSON.stringify(events) });
    });
});

app.listen(3000);
console.log('Listening on port 3000');
