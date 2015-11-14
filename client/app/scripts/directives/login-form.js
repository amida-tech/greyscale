"use strict";

angular.module('greyscaleApp')
    .directive('loginForm', function (greyscaleAuthSrv, $state, $log) {
        return {
            templateUrl: 'views/directives/login-form.html',
            restrict: 'AE',
            scope: {},
            controller: function ($scope) {
                $scope.model = {
                    login: {
                        label: 'E-m@il',
                        value: null
                    },
                    password: {
                        label: 'Password',
                        value: null
                    },
                    error: null
                };

                $scope.restorePasswd = function () {
                    $log.debug("need API call");
                };

                $scope.submitLogin = function () {
                    if ($scope.loginForm.$valid) {
                        greyscaleAuthSrv.login($scope.model.login.value, $scope.model.password.value)
                            .then(function () {
                                $state.go('main');
                            }).catch(function () {
                                $scope.model.error = 'Please check your Login/Password';
                            });
                    } else {
                        $scope.model.error = 'Please check your Login/Password';
                    }
                };
            }
        };
    });
