/*jslint nomen: true, sloppy: true, node: true, es5: true */
/*global require: false */

var express = require('express');
var path    = require('path');
var Bourne  = require("bourne");

var app      = express();
var posts    = new Bourne("simpleBlogPosts.json");
var comments = new Bourne("simpleBlogComments.json");

app.configure(function () {
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));
});

app.get("/posts", function (req, res) {
    posts.find(function (err, results) {
        res.json(results);
    });
});
app.post("/posts", function (req, res) {
    posts.insert(req.body, function (err, result) {
        res.json(result);
    });
});

app.get("/posts/:id/comments", function (req, res) {
    comments.find({ postId: parseInt(req.params.id, 10) }, function (err, results) {
        res.json(results);
    });
});

app.post("/posts/:id/comments", function (req, res) {
    comments.insert(req.body, function (err, result) {
        res.json(result);
    });
});

app.get('/*', function (req, res) {
    posts.find(function (err, results) {
        res.render("index.ejs", { posts: JSON.stringify(results) });
    });
});

app.listen(3000);
