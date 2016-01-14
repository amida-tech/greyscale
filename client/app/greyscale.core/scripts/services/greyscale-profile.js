/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($rootScope, $cookieStore, $q, greyscaleTokenSrv, greyscaleUserSrv, $log,
                                              greyscaleGlobals, _) {
        var _profile = null;
        var _profilePromise = null;
        var _accessLevel = greyscaleGlobals.systemRoles.nobody.mask;

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
                        _profilePromise = greyscaleUserSrv.get()
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
                _accessLevel = _.get(_.find(greyscaleGlobals.systemRoles, {id: _profile.roleID}), 'mask') ||
                    greyscaleGlobals.systemRoles.user.mask;
            }
        };

        this.getAccessLevelMask =function () {
            return _accessLevel;
        };

        this.getAccessLevel = function () {
            return this.getProfile()
                .then(this.getAccessLevelMask)
                .catch(function (err) {
                    $log.debug('getAccessLevel says:', err);
                    return greyscaleGlobals.systemRoles.nobody.mask;
                });
        };

        this.login = function () {
            return this.getProfile(true);
        };

        this.logout = function () {
            return greyscaleUserSrv.logout().finally(function () {
                greyscaleTokenSrv(null);
                _profile = null;
                _profilePromise = null;
                _accessLevel = greyscaleGlobals.systemRoles.nobody.mask;
            });
        };
    });
