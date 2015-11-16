/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.user')
    .service('greyscaleProfileSrv', function ($rootScope) {
        var _token = null;

        this.token = function (val) {
            if (angular.isDefined(val)) {
                _token = val;
            } else {
                return _token;
            }
        };

        this.logout = function () {
            _token = null;
            $rootScope.$emit('logout');
        };
    });
