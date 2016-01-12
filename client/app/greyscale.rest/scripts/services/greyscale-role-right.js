/**
 * Created by igi on 11.01.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleRoleRightSrv', function (greyscaleRestSrv){
        return {
            list: _list
        };

        function _api(roleId) {
            return greyscaleRestSrv().one('roles', roleId + '').one('rights');
        }

        function _list(roleId, param) {
            return _api(roleId).get(param);
        }
    });
