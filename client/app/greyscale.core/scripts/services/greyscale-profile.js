/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($q, _, greyscaleTokenSrv, greyscaleUserApi, $log,
        greyscaleEntityTypeRoleApi, greyscaleUtilsSrv) {
        var _profile = null;
        var _profilePromise = null;
        var _userRoles = [];
        var _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true);

        this.getProfile = function (force) {
            var self = this;
            var res;
            if (!greyscaleTokenSrv()) {
                _profile = null;
                _profilePromise = null;
                res = $q.reject('not logged in');
            } else {
                if (_profile && !force) {
                    res = $q.resolve(_profile);
                } else {
                    if (!_profilePromise || force) {
                        _profilePromise = greyscaleUserApi.get()
                            .then(function (profileData) {
                                _profile = profileData;
                                self._setAccessLevel();
                                return _profile;
                            })
                            .finally(function () {
                                _profilePromise = null;
                            });
                    }
                    res = _profilePromise;
                }
            }
            return res;
        };

        this._setAccessLevel = function () {
            if (_profile) {
                _accessLevel = greyscaleUtilsSrv.getRoleMask(_profile.roleID, true);
                greyscaleEntityTypeRoleApi.list({
                    userId: _profile.id
                }).then(function (usrRoles) {
                    for (var r = 0; r < usrRoles.length; r++) {
                        _accessLevel = _accessLevel | greyscaleUtilsSrv.getRoleMask(usrRoles[r].roleId);
                    }
                    _userRoles = usrRoles;
                });
            }
        };

        this.getAccessLevelMask = function () {
            return _accessLevel;
        };

        this.getAccessLevel = function () {
            return this.getProfile()
                .then(this.getAccessLevelMask)
                .catch(function (err) {
                    $log.debug('getAccessLevel says:', err);
                    return greyscaleUtilsSrv.getRoleMask(-1, true);
                });
        };

        this.login = function () {
            return this.getProfile(true);
        };

        this.logout = function () {
            return greyscaleUserApi.logout().finally(function () {
                greyscaleTokenSrv(null);
                _profile = null;
                _profilePromise = null;
                _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true);
            });
        };
    });
