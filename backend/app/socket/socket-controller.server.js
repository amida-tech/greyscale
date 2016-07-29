'use strict';

var io = require('socket.io');
var sPolicy = require('app/services/policies');
var Token = require('app/models/token');
var sUser = require('app/services/users');
var sPolicy = require('app/services/policies');
var config = require('config');
var Query = require('app/util').Query;
var thunkify = require('thunkify');
var co = require('co');

var debug = require('debug')('debug_socket-controller.server');
debug.log = console.log.bind(console);

var ioServer;

var socketEvents = {
    policyLock: 'POLICY_LOCK', //income
    policyUnlock: 'POLICY_UNLOCK', //income
    setUser: 'setUser', //income
    policyLocked: 'POLICY_LOCKED', //outcome
    policyUnlocked: 'POLICY_UNLOCKED', //outcome
    somethingNew: 'something-new' //outcome
};

exports.sendNotification = function (userId) {
    var clients = ioServer.sockets.sockets;
    for (var i in clients) {
        if (clients[i].req.user.id !== userId) {
            continue;
        }
        debug('send notification to user ' + clients[i].userId);
        clients[i].emit(socketEvents.somethingNew);
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

        socket.on(socketEvents.policyLock, function (data) {
            debug('policyLock');
            debug(socket.req);
            if (socket.req && socket.req.user && socket.req.user.id){
                co(function* () {
                    var oPolicy = new sPolicy(socket.req);
                    debug(socket.req.user.id);
                    try{
                        var policy = yield oPolicy.lockPolicy(data.policyId, socket.req.user.id, socket.id);
                    }catch(err){
                        debug(JSON.stringify(err));
                        var policy = yield oPolicy.getById(data.policyId);
                    }
                    return policy;
                }).then(
                    (policy) => {
                        var response = {
                            policyId: policy.id,
                            editor: policy.editor,
                            tsLock: policy.startEdit
                        };
                        debug(response);
                        socket.emit(socketEvents.policyLocked, response);
                    },
                    (err) => {
                        // emit policy locked error
                        debug(JSON.stringify(err));
                    }
                );
            }
        });

        socket.on(socketEvents.setUser, function (data) {

            // We pass req to services constructor as something like session
            // from req we can get info about current schema, user id, etc
            // and use it inside service methods instead of pass it to each method as parameters
            var req = {}; // emulate req object.

            var thunkQueryPublic = thunkify(new Query(config.pgConnect.adminSchema));

            co(function*(){
                var token = yield thunkQueryPublic(Token.select().where(Token.body.equals(data.token)));
                debug(token);
                if (!token.length) {
                    // TODO emit error token invalid
                } else {
                    req.thunkQuery = thunkify(new Query(token[0].realm));
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
