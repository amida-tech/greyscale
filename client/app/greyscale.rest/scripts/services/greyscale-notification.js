'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleNotificationApi', function (greyscaleRestSrv) {

        return {
            list: _list,
            resendUserInvite: _resendUserInvite
        };

        function api() {
            return greyscaleRestSrv().one('notifications');
        }

        function _list(param) {
            return api().get(param);
        }

        function _resendUserInvite(userId) {
            return api().one('resenduserinvite').one('' + userId).customPUT();
        }

    });
