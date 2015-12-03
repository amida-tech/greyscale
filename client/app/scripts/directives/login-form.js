"use strict";

angular.module('greyscaleApp')
    .directive('loginForm', function (greyscaleAuthSrv, $state, greyscaleEnv, $log) {
        return {
            templateUrl: 'views/directives/login-form.html',
            restrict: 'AE',
            scope: {},
            controller: function ($scope) {
                $scope.model = {
                    login: {
                        label: 'E-m@il',
                        value: greyscaleEnv.defaultUser || ''
                    },
                    password: {
                        label: 'Password',
                        value: greyscaleEnv.defaultPassword || ''
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
                            }).catch(function (err) {
                                $log.debug(err);
                                $scope.model.error = 'Please check your E-mail/Password';
                            });
                    } else {
                        $scope.model.error = 'Please check your Login/Password';
                    }
                };
            }
        };
    });
