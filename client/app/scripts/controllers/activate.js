/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ActivateCtrl', function ($scope, greyscaleUserSrv, $state, $stateParams, inform) {
        greyscaleUserSrv.checkActivationToken($stateParams.token)
            .then(function (resp) {
                $scope.user = resp;
            }, function (err) {
                inform.add(err.data.message, {type: 'danger'});
                $state.go('login');
            });
    });
