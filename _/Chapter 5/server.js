/*jslint node: true, es5: true, nomen: true */
var express = require('express');
var path    = require('path');
var Bourne  = require("bourne");
var http = require('http');
var socketio = require('socket.io');

var app = express();
var db  = new Bourne("messages.json");
var server = http.createServer(app);
var io = socketio.listen(server);

app.configure(function () { app.use(express.static(path.join(__dirname, 'public'))); });
app.get('/*', function (req, res) { res.render("index.ejs"); });
server.listen(3000);

var users = {};

function userExists (name) {
    return Object.keys(users).map(function (id) {
        return users[id].name;
    }).indexOf(name) > -1;
}

io.sockets.on('connection', function (socket) {
    Object.keys(users).forEach(function (id) {
        socket.emit('user:join', users[id]);
    });

    db.find(function (err, records) {
        var rooms = {};
        records.forEach(function (record) { rooms[record.room] = 0; });
        Object.keys(rooms).forEach(function (room) {
            socket.emit('room:new', room);
        })
    });

    socket.on('join', function (name, res) {
        if (userExists(name)) {
            res(false); 
        } else {
            res(true);
            users[socket.id] = { name: name };
            io.sockets.emit('user:join', { name: name });
        }
    });

    socket.on('message:new', function (data) {
        db.insert(data, function (err, msg) {
            io.sockets.emit('message:new', msg);

            db.find({ room:data.room }, function (err, msgs) {
                if (msgs.length === 1) {
                    io.sockets.emit('room:new', data.room);
                }
            });
        });
    });

    socket.on('room:join', function (room, res) {
        db.find({ room: room }, function (err, msgs) {
            res(msgs);
        });
    });

    socket.on('disconnect', function () {
        if (users[socket.id]) {
            io.sockets.emit('user:leave', users[socket.id]);
            delete users[socket.id]; 
        }
    });
}); 
