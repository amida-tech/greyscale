'use strict';

angular.module('greyscale.core')
    .service('greyscaleWebSocketSrv', function (greyscaleEnv, greyscaleTokenSrv, Organization,
        $rootScope, greyscaleGlobals) {

        var socket;
        var events = greyscaleGlobals.events;

        $rootScope.$on(events.common.login, _init);
        $rootScope.$on(events.common.logout, _close);

        this.init = _init;
        this.emit = _emit;
        this.on = _on;
        this.id = _getId;
        this.off = _off;

        function _setUser() {
            _emit(events.ws.setUser, {
                token: greyscaleTokenSrv()
            });
        }

        function _init() {
            socket = _open();
            socket.on('connect', function () {
                _setUser();
            });

            socket.on('reconnect', function () {
                _setUser();
            });
        }

        function _close() {
            if (socket) {
                socket.off('connect');
                socket.off('reconnect');
                socket.close();
            }
        }

        function _emit(eventName, data) {
            if (socket) {
                socket.emit(eventName, angular.extend({
                    socketId: _getId()
                }, data));
            }
        }

        function _on(eventName, handler) {
            if (socket && typeof handler === 'function') {
                socket.on(eventName, handler);
            }
        }

        function _off(e, fn) {
            if (socket) {
                socket.off(e, fn);
            }
        }

        function _open() {
            var url = (greyscaleEnv.apiProtocol || 'http') + '://' +
                ([greyscaleEnv.apiHostname, greyscaleEnv.apiPort].join(':') + '/'),
                opts = {
                    transports: ['websocket']
                };

            return window.io(url, opts);
        }

        function _getId() {
            return socket ? socket.id : null;
        }
    })
    .run(function (greyscaleWebSocketSrv, greyscaleTokenSrv) {
        if (greyscaleTokenSrv()) {
            greyscaleWebSocketSrv.init();
        }
    });
