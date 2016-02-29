/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($q, greyscaleTokenSrv, greyscaleUserApi, greyscaleEntityTypeRoleApi,
        greyscaleUtilsSrv, greyscaleGlobals, i18n, $log) {

        var _profile = null;
        var _profilePromise = null;
        var _userRoles = [];
        var _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true);
        var _messages = [];
        var _associate = {};
        var _associateArray = [];

        this.isSuperAdmin = _isSuperAdmin;

        this.isAdmin = _isAdmin;

        this.getProfile = function (force) {
            var self = this;

            return greyscaleUserApi.isAuthenticated().then(function (isAuth) {
                var res;

                if (isAuth) {
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
                                /*.then(self._setAssociate)*/
                                .finally(function () {
                                    _profilePromise = null;
                                });
                        }
                        res = _profilePromise;
                    }
                } else {
                    _profile = null;
                    _profilePromise = null;
                    res = $q.reject('not logged in');
                }

                return res;
            });
        };

        this._setAccessLevel = function () {
            if (_profile) {
                _accessLevel = greyscaleUtilsSrv.getRoleMask(_profile.roleID, true);
                return greyscaleEntityTypeRoleApi.list({
                    userId: _profile.id
                }).then(function (usrRoles) {
                    for (var r = 0; r < usrRoles.length; r++) {
                        if (usrRoles.userId === _profile.id) {
                            _accessLevel = _accessLevel | greyscaleUtilsSrv.getRoleMask(usrRoles[r].roleId);
                        }
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
                return greyscaleUserApi.list({
                        organizationId: _profile.organizationId // while API users/self/associate not implemented
                    })
                    .then(function (associate) {
                        var i, user,
                            qty = associate.length;
                        _associate = {};
                        _associateArray = [];
                        for (i = 0; i < qty; i++) {
                            user = associate[i];
                            if (!user.isAnonymous || _isAdmin()) {
                                _associate[user.id] = {
                                    id: user.id,
                                    firstName: user.firstName || '',
                                    lastName: user.lastName || '',
                                    email: user.email || ''
                                };
                                _associateArray.push(_associate[user.id]);
                            }

                        }
                        return _profile;
                    })
                    .catch(function (err) {
                        $log.debug(err.message || err);
                        _associate = {};
                        _associateArray = [];
                        return _profile;
                    });
            } else {
                return $q.reject('no user data loaded');
            }
        };
        /* disabled while not used
                this.getAssociate = function () {
                    return this.getProfile()
                        .then(function () {
                            return _associate;
                        })
                        .catch(function () {
                            return [];
                        });
                };

                this.getMember = function (userId) {
                    var member = _associate[userId];
                    if (!member) {
                        member = {
                            id: userId,
                            firstName: i18n.translate('USERS.ANONYMOUS'),
                            lastName: '',
                            email: ''
                        };
                    }
                    return member;
                };

                this.recentMessages = function () {
                    return $q.reject('recentMessages is not implemented yet');
                };

                this.getMessages = function () {
                    return _messages;
                };
        */
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
                _profile = null;
                _profilePromise = null;
                _accessLevel = greyscaleUtilsSrv.getRoleMask(-1, true);
            });
        };

        function _isSuperAdmin() {
            return (_accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) === greyscaleGlobals.userRoles.superAdmin.mask;
        }

        function _isAdmin() {
            return (_accessLevel & greyscaleGlobals.userRoles.admin.mask) === greyscaleGlobals.userRoles.admin.mask;
        }
    });
