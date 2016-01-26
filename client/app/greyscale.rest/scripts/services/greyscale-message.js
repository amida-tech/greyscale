/**
 * Created by igi on 25.01.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleMessageApi', function (greyscaleRestSrv) {
        return {
            list: _list,
            edit: _edit,
            create: _create
        };

        function _api(userId) {
            return greyscaleRestSrv().one('messages', userId + '');
        }

        function _list(userId, params) {
            return _api(userId).get(params);
        }

        function _edit(userId, body) {
            return _api(userId).customPUT(body);
        }

        function _create(userId, body) {
            return _api(userId).customPOST(body);
        }
    });
