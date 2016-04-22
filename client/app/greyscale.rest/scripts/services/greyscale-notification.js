'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleNotificationApi', function (greyscaleRestSrv) {

        return {
            list: _list,
            resendUserInvite: _resendUserInvite,
            send: _send,
            setRead: _setRead,
            setUnread: _setUnread
        };

        function api(realm) {
            return greyscaleRestSrv({}, realm).one('notifications');
        }

        function _list(param, realm) {
            return api(realm).get(param);
        }

        function _resendUserInvite(userId, realm) {
            return api(realm).one('resenduserinvite').one('' + userId).customPUT();
        }

        function _send(data, realm) {
            return api(realm).customPOST(data);
        }

        function _setRead(id, realm) {
            return api(realm).one('markread').one('' + id).customPUT();
        }

        function _setUnread(id, realm) {
            return api(realm).one('markunread').one('' + id).customPUT();
        }

    });
