'use strict';

/**
 * @ngdoc function
 * @name greyscaleClientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the greyscaleClientApp
 */
angular.module('greyscaleClientApp')
    .controller('MainCtrl', function (greyscaleAuthSrv) {
        greyscaleAuthSrv.isAuthenticated()
            .then(function (isAuthenticated) {
                if (!isAuthenticated) {
                    $state.go('login');
                }
            });
    });
