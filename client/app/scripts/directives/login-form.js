'use strict';

angular.module('greyscaleApp')
    .directive('loginForm', function (greyscaleUserApi, greyscaleEnv, $rootScope, $log) {
        return {
            templateUrl: 'views/directives/login-form.html',
            restrict: 'AE',
            scope: {},
            controller: function ($scope, $rootScope) {
                $scope.model = {
                    login: greyscaleEnv.defaultUser || '',
                    password: greyscaleEnv.defaultPassword || '',
                    orgs: [],
                    error: null,
                    realm: 'public'
                };

                $scope.submitLogin = function () {
                    if ($scope.loginForm.$valid) {
                        greyscaleUserApi.login($scope.model.login, $scope.model.password)
                            .then(function () {
                                $rootScope.$emit('login');
                            })
                            .catch(function (err) {
                                $log.debug(err);
                                if (err && err.data && err.data.e === 300) {
                                    $scope.model.orgs = err.data.message
                                } else {
                                    $scope.model.error = 'LOGIN.CHECK_EMAIL_PASSWORD';
                                }
                            });
                    } else {
                        $scope.model.error = 'LOGIN.CHECK_LOGIN_PASSWORD';
                    }
                };

                $scope.updateOrg = function() {
                    $log.debug($scope.model.realm);
                    $rootScope.realm = $scope.model.realm;
                };
            }
        };
    });
