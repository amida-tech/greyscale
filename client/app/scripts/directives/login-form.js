'use strict';

angular.module('greyscaleApp')
    .directive('loginForm', function (greyscaleUserApi, greyscaleEnv, greyscaleGlobals) {
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

                $scope.loginChange = initForm;

                $scope.submitLogin = function () {
                    if ($scope.loginForm.$valid) {
                        greyscaleUserApi.login($scope.model.login, $scope.model.password)
                            .then(function () {
                                $rootScope.$broadcast(greyscaleGlobals.events.common.login);
                            })
                            .catch(function (err) {
                                if (err) {
                                    if (err.status === 300 || err.data.e === 300) {
                                        $scope.model.realms = err.data.message;
                                    } else {
                                        $scope.model.error = err.data.message;
                                    }
                                }
                            });
                    } else {
                        $scope.model.error = 'LOGIN.CHECK_LOGIN_PASSWORD';
                    }
                };

                function initForm() {
                    angular.extend($scope.model, {
                        realms: [],
                        error: null
                    });
                }
            }
        };
    });
