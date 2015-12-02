/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.user')
    .service('greyscaleProfileSrv', function ($rootScope, $cookieStore) {
        var _token = undefined;

        this.token = function (val) {
            if (typeof val !== 'undefined') {
                _token = val;
                $cookieStore.put('token', val);
            } else {
                if (!_token) {
                    _token = $cookieStore.get('token');
                }
            }
            return _token;
        };

        this.logout = function () {
            _token = undefined;
            $cookieStore.remove('token');
            $rootScope.$emit('logout');
            return this;
        };
    });
