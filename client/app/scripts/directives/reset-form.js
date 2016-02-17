/**
 * Created by sbabushkin on 01.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('resetForm', function ($state, greyscaleUserApi) {

        return {
            templateUrl: 'views/directives/reset-form.html',
            restrict: 'AE',
            scope: {
                token: '=resetForm'
            },
            controller: function ($scope) {
                function errHandler(err) {
                    if (err.data && err.data.message) {
                        $scope.model.err = err.data.message;
                    }
                }

                $scope.model = {
                    login: '',
                    err: 'qqq'
                };

                greyscaleUserApi.resetToken($scope.token)
                    .then(function (user) {
                        $scope.model = user;
                    })
                    .catch(errHandler);

                $scope.reset = function () {

                    delete $scope.model.password_conf;

                    greyscaleUserApi.resetPasswd({
                        token: $scope.token,
                        password: $scope.model.password
                    })
                        .then(function () {
                            $scope.success = 'LOGIN.RESET_SUCCESS';
                        })
                        .catch(errHandler);
                };
            }
        };
    });
