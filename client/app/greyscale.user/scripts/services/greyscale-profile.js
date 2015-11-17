/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.user')
    .service('greyscaleProfileSrv', function ($rootScope) {
        var _token = null;

        this.token = function (val) {
            if (typeof val !== 'undefined') {
                _token = val;
            }
            return _token;
        };

        this.logout = function () {
            _token = null;
            $rootScope.$emit('logout');
            return this;
        };
    });
