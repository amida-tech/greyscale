/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleRoleApi', function (greyscaleRestSrv) {
        return {
            list: _list,
            listRights: function (roleId) {
                return _rights(roleId).get().then(_postProc);
            },
            addRight: function (roleId, rightId) {
                return _rights(roleId).one(rightId + '').customPOST();
            },
            delRight: function (roleId, rightId) {
                return _rights(roleId).one(rightId + '').remove();
            }
        };

        function _roles(realm) {
            return greyscaleRestSrv({}, realm);
        }

        function _rights(roleId) {
            return _roles()/*.one('roles')*/.one(roleId + '', 'rights');
        }

        function _postProc(resp) {
            return (resp) ? resp.plain() : resp;
        }

        function _list(params, realm) {
            return _roles(realm).one('roles').get(params).then(_postProc);
        }
    });
