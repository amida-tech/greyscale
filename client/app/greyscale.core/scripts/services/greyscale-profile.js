/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($q, _, greyscaleTokenSrv, greyscaleUserApi, $log,
                                              greyscaleEntityTypeRoleApi, greyscaleUtilsSrv, greyscaleMessagesApi) {
        var _profile = null;
        var _profilePromise = null;
        var _userRoles = [];
        var _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true);
        var _messages = [];
        var _associate = [];

        this.getProfile = function (force) {
            var self = this;
            var res;
            if (!greyscaleTokenSrv()) {
                _profile = null;
                _profilePromise = null;
                res = $q.reject('not logged in');
            } else {
                if (_profile && !force) {
                    self._setAccessLevel();
                    res = $q.resolve(_profile);
                } else {
                    if (!_profilePromise || force) {
                        _profilePromise = greyscaleUserApi.get()
                            .then(function (profileData) {
                                _profile = profileData;
                                return _profile;
                            })
                            .then(self._setAccessLevel)
                            .then(self._setAssociate)
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
                return greyscaleEntityTypeRoleApi.list({
                    userId: _profile.id
                }).then(function (usrRoles) {
                    for (var r = 0; r < usrRoles.length; r++) {
                        _accessLevel = _accessLevel | greyscaleUtilsSrv.getRoleMask(usrRoles[r].roleId);
                    }
                    _userRoles = usrRoles;
                    return _profile;
                });
            } else {
                return $q.reject('no user data loaded');
            }
        };

        this._setAssociate = function () {
            if (_profile) {
                return greyscaleUserApi.list({organizationId: _profile.organizationId})
                    .then(function(associate){
                        _associate = associate;
                        return _profile;
                    });
            } else {
                return $q.reject('no user data loaded');
            }
        };

        this.recentMessages = function () {
            return $q.reject('recentMessages is not implemented yet');
        };

        this.getMessages = function () {
            return _messages;
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
