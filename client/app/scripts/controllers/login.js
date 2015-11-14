/**
 * Created by igi on 09.11.15.
 */
"use strict";

angular.module('greyscaleApp')
    .controller('LoginCtrl', function ($state, greyscaleAuthSrv) {
        greyscaleAuthSrv.isAuthenticated()
            .then(function (isAuthenticated) {
                if (isAuthenticated) {
                    $state.go('main');
                }
            });
    });
