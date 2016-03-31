'use strict';

var io = require('socket.io');

var debug = require('debug')('debug_socket-controller.server');

var ioServer;

exports.sendNotification = function (userId) {
    var clients = ioServer.sockets.sockets;
    for (var i in clients) {
        if (clients[i].userId !== userId) continue;
        debug('send notification to user ' + clients[i].userId);
        clients[i].emit('something-new');
    }
};

exports.init = function (server) {
    if (ioServer || !server) return;

    ioServer = io.listen(server);
    ioServer.on('connection', function (socket) {
        debug('Socket connected ' + socket.id);

        socket.on('disconnect', function (reason) {
            debug('Socker disconnected ' + socket.id);
        });

        socket.on('setUser', function (data) {
            socket.userId = data.userId;
            debug('User set ' + socket.id);
        });
    });
};
