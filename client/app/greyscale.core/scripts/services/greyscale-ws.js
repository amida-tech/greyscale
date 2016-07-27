'use strict';

angular.module('greyscale.core')
    .service('greyscaleWebSocketSrv', function (greyscaleProfileSrv, greyscaleEnv, greyscaleTokenSrv, Organization) {
        var socket;

        function _setUser() {
            greyscaleProfileSrv.getProfile()
                .then(function (profile) {
                    socket.emit('setUser', {
                        userId: profile.id,
                        token: greyscaleTokenSrv(),
                        realm: Organization.realm
                    });
                });
        }

        this.emit = function (event, data) {
            if (socket) {
                socket.emit(event, data);
            }
        };

        this.init = function () {
            socket = _getConnection();
            socket.on('connect', function () {
                _setUser();
            });
            socket.on('reconnect', function () {
                _setUser();
            });
        };

        this.on = function (event, handler) {
            if (socket) {
                socket.on(event, handler);
            }
        };

        function _getConnection() {
            var domain = window.location.hostname.split('.');
            if (domain[0] === 'www') {
                domain.splice(0, 1);
            }

            var url = (greyscaleEnv.apiProtocol || 'http') + '://' +
                greyscaleEnv.apiHostname +
                (greyscaleEnv.apiPort !== undefined ? ':' + greyscaleEnv.apiPort : '') + '/';

            var opts = {
                transports: ['websocket']
            };

            return window.io(url, opts);
        }
    })
    .run(function (greyscaleWebSocketSrv) {
        greyscaleWebSocketSrv.init();
    });
