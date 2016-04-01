/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ActivateCtrl', function ($scope, greyscaleUserApi, $state, $stateParams, inform, greyscaleRealmSrv, $log) {
        var _realm = $stateParams.realm;
        greyscaleRealmSrv.init(_realm);
        greyscaleUserApi.checkActivationToken($stateParams.token)
            .then(function (resp) {
                $scope.user = {
                    activationToken: resp.activationToken,
                    email: resp.email,
                    firstName: resp.firstName,
                    lastName: resp.lastName
                };
            }, function (err) {
                inform.add(err.data.message, {
                    type: 'danger'
                });
                $state.go('login');
            });
    });
