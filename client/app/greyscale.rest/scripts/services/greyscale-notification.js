'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleNotificationApi', function (greyscaleRestSrv) {

        return {
            list: _list,
            resendUserInvite: _resendUserInvite
            send: _send,
            setRead: _setRead,
            setUnread: _setUnread
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

        function _send(data) {
            return api().customPOST(data);
        }

        function _setRead(id) {
            return api().one('markread').one('' + id).customPUT();
        }

        function _setUnread(id) {
            return api().one('markunread').one('' + id).customPUT();
        }

    });
