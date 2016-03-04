'use strict';

angular.module('greyscale.core')
.service('greyscaleWebSocketSrv', function($rootScope, greyscaleProfileSrv, greyscaleEnv){
    var socket;

    this.setUser = function () {
        greyscaleProfileSrv.getProfile()
            .then(function(profile){
                socket.emit('setUser', { userId: profile.id });
            });
    };

    this.init = function () {
        socket = _getConnection();
        var _this = this;
        socket.on('connect', function () { _this.setUser(); });
        socket.on('reconnect', function () { _this.setUser(); });
        socket.on('something-new', function () { $rootScope.$broadcast('something-new'); });
    };

    function _getConnection() {
        var domain = window.location.hostname.split('.');
        var realm = 'public';
        var baseLength = 'dev-mt'.indexOf(greyscaleEnv.name) !== -1 ? 4 : 3;

        if (domain[0] === 'www') {
            domain.splice(0, 1);
        }

        if (domain.length >= baseLength) {
            realm = domain[0];
        }

        var url = (greyscaleEnv.apiProtocol || 'http') + '://' +
            greyscaleEnv.apiHostname +
            (greyscaleEnv.apiPort !== undefined ? ':' + greyscaleEnv.apiPort : '') + '/' +
            realm + '/' +
            greyscaleEnv.apiVersion;

        var opts = {
            transports: ['websocket']
        };

        return io(url, opts);
    }
})
.run(function(greyscaleWebSocketSrv){
    //greyscaleWebSocketSrv.init();
});
