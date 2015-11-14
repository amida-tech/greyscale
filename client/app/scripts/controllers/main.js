'use strict';

/**
 * @ngdoc function
 * @name greyscaleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the greyscaleApp
 */
angular.module('greyscaleApp')
    .controller('MainCtrl', function (greyscaleAuthSrv) {
        greyscaleAuthSrv.isAuthenticated()
            .then(function (isAuthenticated) {
                if (!isAuthenticated) {
                    $state.go('login');
                }
            });
    });
