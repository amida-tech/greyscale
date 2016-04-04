/**
 * Created by sbabushkin on 01.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('resetForm', function ($state, $stateParams, greyscaleRealmSrv, greyscaleUserApi) {

        return {
            templateUrl: 'views/directives/reset-form.html',
            restrict: 'AE',
            scope: {
                token: '=resetForm'
            },
            controller: function ($scope, $log) {
                function errHandler(err) {
                    if (err.data && err.data.message) {
                        $scope.model.err = err.data.message;
                    }
                }

                $scope.model = {
                    login: '',
                    err: '',
                    success: ''
                };

                if ($state.current.name === 'reset') {
                    var _realm = $stateParams.realm;

                    if (_realm) {
                        greyscaleRealmSrv.init(_realm);
                    }

                    $log.debug('reset form', _realm);

                    greyscaleUserApi.resetToken($scope.token)
                        .then(function (user) {
                            $scope.model = {
                                email: user.email
                            };
                        })
                        .catch(errHandler);
                }

                $scope.reset = function () {
                    greyscaleUserApi.resetPasswd({
                            token: $scope.token,
                            password: $scope.model.password
                        })
                        .then(function () {
                            $scope.model.success = 'LOGIN.RESET_SUCCESS';
                        })
                        .catch(errHandler);
                };
            }
        };
    });
