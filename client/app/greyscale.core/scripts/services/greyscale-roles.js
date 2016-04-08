/**
 * Created by igi on 18.01.16.
 */

'use strict';

angular.module('greyscale.core')
    .service('greyscaleRolesSrv', function ($q, greyscaleRoleApi, greyscaleGlobals) {
        var _roles = {},
            _rolesPromise = {};

        return _rolesList;

        function _rolesList(realm, force) {
            var res = $q.resolve([]);

            if (typeof realm === 'undefined') {
                realm = greyscaleGlobals.adminSchema;
            }

            if (_roles[realm] && !force) {
                res = $q.resolve(_roles[realm]);
            } else {
                if (!_rolesPromise[realm] || force) {
                    _rolesPromise[realm] = greyscaleRoleApi.list({}, realm)
                        .then(function (list) {
                            _roles[realm] = list;
                            return _roles[realm];
                        })
                        .finally(function () {
                            _rolesPromise[realm] = null;
                        });
                }
                res = _rolesPromise[realm];
            }
            return res;
        }
    });
