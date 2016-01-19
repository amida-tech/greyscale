/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ActivateCtrl', function ($scope, greyscaleUserApi, $state, $stateParams, inform) {
        greyscaleUserApi.checkActivationToken($stateParams.token)
            .then(function (resp) {
                $scope.user = resp;
            }, function (err) {
                inform.add(err.data.message, {
                    type: 'danger'
                });
                $state.go('login');
            });
    });
