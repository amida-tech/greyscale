/**
 * Created by igi on 18.01.16.
 */

'use strict';

angular.module('greyscale.core')
    .service('greyscaleRolesSrv', function ($q, greyscaleRoleApi) {
        var _roles = null;
        var _rolesPromise = null;
        this.getRoles = function (force) {
            var res;

            force = !!force;
            if (!_roles || force) {
                if (!_rolesPromise) {
                    _rolesPromise = greyscaleRoleApi.list()
                        .then(function (data) {
                            _roles = data;
                            return _roles;
                        })
                        .finally(function () {
                            _rolesPromise = null;
                        });
                }
                res = _rolesPromise;
            } else {
                res = $q.resolve(_roles);
            }
            return res;
        };
    });
