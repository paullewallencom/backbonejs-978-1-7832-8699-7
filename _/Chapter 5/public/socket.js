App.module('Socket', function (Socket) {
    Socket.io = io.connect('http://localhost:3000');
});
