'use strict';

angular.module('greyscaleApp')
    .directive('loginForm', function (greyscaleUserApi, greyscaleEnv) {
        return {
            templateUrl: 'views/directives/login-form.html',
            restrict: 'AE',
            scope: {},
            controller: function ($scope, $rootScope) {
                $scope.model = {
                    login: greyscaleEnv.defaultUser || '',
                    password: greyscaleEnv.defaultPassword || '',
                    realms: [],
                    error: null
                };

                $scope.submitLogin = function () {
                    if ($scope.loginForm.$valid) {
                        greyscaleUserApi.login($scope.model.login, $scope.model.password)
                            .then(function () {
                                $rootScope.$emit('login');
                            })
                            .catch(function (err) {
                                if (err && err.data && err.data.e === 300) {
                                    $scope.model.realms = err.data.message;
                                } else {
                                    $scope.model.error = 'LOGIN.CHECK_EMAIL_PASSWORD';
                                }
                            });
                    } else {
                        $scope.model.error = 'LOGIN.CHECK_LOGIN_PASSWORD';
                    }
                };
            }
        };
    });
