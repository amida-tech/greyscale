'use strict';

var io = require('socket.io');
var sPolicy = require('app/services/policies');
var Token = require('app/models/token');
var sUser = require('app/services/users');
var sPolicy = require('app/services/policies');
var config = require('config');
//var User = require('app/models/users');
//var Token =
var Query = require('app/util').Query;
var thunkify = require('thunkify');
var co = require('co');

var debug = require('debug')('debug_socket-controller.server');
debug.log = console.log.bind(console);

var ioServer;

exports.sendNotification = function (userId) {
    var clients = ioServer.sockets.sockets;
    for (var i in clients) {
        if (clients[i].userId !== userId) {
            continue;
        }
        debug('send notification to user ' + clients[i].userId);
        clients[i].emit('something-new');
    }
};

exports.policyLocked = function (policyId) {
    var clients = ioServer.sockets.sockets;
    for (var i in clients) {
        //if (clients[i].userId !== userId) {
        //    continue;
        //}
        //debug('send notification to user ' + clients[i].userId);
        clients[i].emit('policyLocked',policyId);
    }
};

exports.init = function (server) {
    if (ioServer || !server) {
        return;
    }

    ioServer = io.listen(server);
    ioServer.on('connection', function (socket) {
        debug('Socket connected ' + socket.id);

        socket.on('disconnect', function (reason) {
            debug('Socket disconnected ' + socket.id);
        });

        socket.on('policyLocked', function (data) {
            debug(socket.req);
            debug('Got policy locked, id =  ' + data.policyId);
            co(function* () {
                var oPolicy = new sPolicy(socket.req);
                debug(socket.req.user.id);
                var policy = yield oPolicy.setEditor(data.policyId, socket.req.user.id);
                return policy;
            }).then(
                (policy) => {
                    var response = {
                        policyId: policy.id,
                        editor: policy.editor,
                        tsLock: policy.startEdit
                    };
                    debug(response);
                    socket.emit('policyLocked', response);
                },
                (err) => {
                    // emit policy locked error
                }
            );
        });

        socket.on('setUser', function (data) {
            debug(data.realm);
            var thunkQuery = thunkify(new Query(data.realm));
            // We pass req to services constructor as something like session
            // from req we can get info about current schema, user id, etc
            // and use it inside service methods instead of pass it to each method as parameters
            var req = { // emulate req object.
                thunkQuery: thunkQuery
            };

            var thunkQueryPublic = thunkify(new Query(config.pgConnect.adminSchema));

            co(function*(){
                var token = yield thunkQueryPublic(Token.select().where(Token.body.equals(data.token)));
                debug(token);
                if (!token.length) {
                    // TODO emit error token invalid
                } else {
                    var oUser = new sUser(req, token[0].realm);
                    req.user = yield oUser.getInfo(token[0].userID);
                    if (!req.user || (token[0].userID !== data.userId)) {
                        // TODO emit error token invalid
                    }
                    socket.req = req;
                    debug(socket.req);
                    debug('User set ' + socket.id);
                }
            }).then(
                (data) => debug(data),
                (err) => debug(err) // TODO emit error token invalid
            );


        });
    });
};
