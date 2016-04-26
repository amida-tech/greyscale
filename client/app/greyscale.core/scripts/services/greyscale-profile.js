/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($q, greyscaleTokenSrv, greyscaleUserApi, greyscaleRolesSrv,
        greyscaleUtilsSrv, greyscaleGlobals, $log, $rootScope, greyscaleRealmSrv, $interval, greyscaleEnv) {

        var _tokenChecker,
            _profile = null,
            _profilePromise = null,
            _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true),
            _tokenTTL = (greyscaleEnv.tokenTTLsec || greyscaleGlobals.tokenTTLsec) * 1000;

        this.isSuperAdmin = _isSuperAdmin;

        this.isAdmin = _isAdmin;

        this.getProfile = function (force) {
            var res = $q.reject('not logged in'),
                self = this,
                token = greyscaleTokenSrv();

            if (token) {
                if (_profile && !force) {
                    res = self._setAccessLevel();
                } else {
                    if (!_profilePromise || force) {
                        _profilePromise = greyscaleUserApi.get(greyscaleRealmSrv.origin())
                            .then(function (profileData) {
                                _cancelTokenChecker();
                                _tokenChecker = $interval(_checkToken, _tokenTTL);
                                _profile = profileData.plain();
                                return _profile;
                            })
                            .then(self._setAccessLevel)
                            .finally(function () {
                                _profilePromise = null;
                            });
                    }
                    res = _profilePromise;
                }
            } else {
                _profile = null;
                _profilePromise = null;
            }

            return res;
        };

        this._setAccessLevel = function (profile) {
            var res = $q.reject('no user data loaded');

            if (typeof profile === 'undefined') {
                profile = _profile;
            }

            if (profile) {
                res = greyscaleRolesSrv(greyscaleRealmSrv.origin())
                    .then(function (roles) {
                        greyscaleGlobals.setRolesId(roles);
                        _accessLevel = greyscaleUtilsSrv.getRoleMask(profile.roleID, true);
                        $rootScope.checkAccessRole = _checkAccessRole;
                        return profile;
                    });
            }

            return res;
        };

        this.getAccessLevelMask = function () {
            return _accessLevel;
        };

        this.getAccessLevel = function () {
            return this.getProfile()
                .then(this.getAccessLevelMask)
                .catch(function (err) {
                    _logout();
                    $log.debug('getAccessLevel says:', err);
                    return _accessLevel;
                });
        };

        this.login = function () {
            return this.getProfile(true);
        };

        this.logout = function () {
            return greyscaleUserApi.logout()
                .finally(_logout);
        };

        function _logout() {
            _cancelTokenChecker();
            greyscaleTokenSrv(null);
            greyscaleRealmSrv.init(null);
            _profile = null;
            _profilePromise = null;
            _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true);

        }

        function _isSuperAdmin() {
            return (_accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) === greyscaleGlobals.userRoles.superAdmin.mask;
        }

        function _isAdmin() {
            return (_accessLevel & greyscaleGlobals.userRoles.admin.mask) === greyscaleGlobals.userRoles.admin.mask;
        }

        function _checkAccessRole() {
            if (!_profile) {
                return;
            }
            var checkRoles = Array.prototype.slice.call(arguments);
            var hasAccess = false;
            angular.forEach(checkRoles, function (role) {
                if (hasAccess) {
                    return;
                }
                if (role === 'nobody') {
                    return;
                }
                if (role === 'all') {
                    hasAccess = true;
                    return;
                }
                var roleData = greyscaleGlobals.userRoles[role];
                if (!roleData) {
                    throw 'Unknown role "' + role + '"!';
                }
                if (roleData.id === _profile.roleID) {
                    hasAccess = true;
                }
            });
            return hasAccess;
        }

        function _checkToken() {
            greyscaleUserApi.isAuthenticated(greyscaleRealmSrv.origin())
                .then(function (isAuth) {
                    if (!isAuth) {
                        greyscaleUtilsSrv.errorMsg('ERROR.BAD_TOKEN');
                        $rootScope.$broadcast(greyscaleGlobals.events.common.logout);
                    }
                });
        }

        function _cancelTokenChecker() {
            if (_tokenChecker) {
                $interval.cancel(_tokenChecker);
            }
        }
    });
