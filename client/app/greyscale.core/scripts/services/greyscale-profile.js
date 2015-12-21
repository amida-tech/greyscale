/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .service('greyscaleProfileSrv', function ($rootScope, $cookieStore, $q, greyscaleTokenSrv, greyscaleUserSrv) {
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

        this.logout = function () {
            greyscaleTokenSrv(null);
            $cookieStore.remove('token');
            $rootScope.$emit('logout');
            return this;
        };
    });
