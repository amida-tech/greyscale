/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleTokenSrv', function ($cookies) {
        var _token = null;
        return function (val) {
            if (typeof val !== 'undefined') {
                _token = val;
                if (val) {
                    $cookies.put('token', val);
                } else {
                    $cookies.remove('token');
                }
            } else {
                if (!_token) {
                    _token = $cookies.get('token');
                }
            }
            return _token;
        };
    });
