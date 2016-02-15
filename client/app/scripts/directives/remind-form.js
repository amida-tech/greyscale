'use strict';

angular.module('greyscaleApp')
    .directive('remindForm', function (greyscaleUserApi, greyscaleEnv, $state, $log) {
        return {
            templateUrl: 'views/directives/remind-form.html',
            restrict: 'AE',
            scope: {},
            controller: function ($scope) {
                $scope.model = {
                    login: {
                        label: 'LOGIN.EMAIL',
                        value: greyscaleEnv.defaultUser || ''
                    },
                    error: null,
                    success: ''
                };

                $scope.remind = function () {
                    if ($scope.remindForm.$valid) {
                        $scope.model.error = '';
                        greyscaleUserApi.remindPasswd($scope.model.login.value)
                            .then(function () {
                                $scope.model.success = 'LOGIN.TOKEN_SENT';
                            }).catch(function (err) {
                                $log.debug(err);
                                $scope.model.error = 'LOGIN.LOGIN_INCORRECT';
                            });
                    } else {
                        $scope.model.error = 'LOGIN.CHECK_LOGIN_PASSWORD';
                    }
                };
            }
        };
    });
