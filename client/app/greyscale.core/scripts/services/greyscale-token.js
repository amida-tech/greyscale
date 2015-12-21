/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .factory('greyscaleTokenSrv', function ($cookieStore) {
        var _token = null;
        return function (val) {
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
    });
