/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($rootScope, $cookieStore, $q, greyscaleTokenSrv, greyscaleUserSrv, $log) {
        var _profile = null;
        var _profilePromise = null;

        this.getProfile = function (force) {
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
                                return profileData;
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

        //todo: re-factor method isAdmin
        this.getAccessLevel = function () {
            return this.getProfile()
                .then(function (profileData) {
                    var res = 0x7ffe; //any logged in user
                    switch (profileData.roleID) {
                    case 1:
                        res = 0x8000; //admin user
                        break;
                    }
                    return res; //while no other way
                })
                .catch(function (err) {
                    $log.debug('getAccessLevel says:', err);
                    return 1;
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
            });
        };
    });
