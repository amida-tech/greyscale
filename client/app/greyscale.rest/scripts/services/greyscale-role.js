/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .service('greyscaleRoleSrv', function (greyscaleRestSrv) {
        var _roleRights = function (roleId) {
            return greyscaleRestSrv().one('roles', roleId+'').one('rights');
        };

        return {
            list: function () {
                return greyscaleRestSrv().one('roles').get();
            },
            listRights: function (roleId) {
                return _roleRights(roleId+'').get();
            },
            addRight: function (roleId, rightId) {
                return _roleRights(roleId+'').one(rightId+'').customPOST();
            },
            delRight: function (roleId, rightId) {
                return _roleRights(roleId+'').one(rightId+'').remove();
            }
        };
    });
