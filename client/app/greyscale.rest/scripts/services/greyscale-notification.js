'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleNotificationApi', function (greyscaleRestSrv) {

        return {
            list: _list
        };

        function api() {
            return greyscaleRestSrv().one('notifications');
        }

        function _list(param) {
            return api().get(param);
        }

    });
