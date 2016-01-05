/**
 * Created by igi on 14.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('registerForm', function ($state, greyscaleUserSrv, greyscaleRoleSrv, $log) {
        return {
            templateUrl: 'views/directives/register-form.html',
            restrict: 'AE',
            controller: function ($scope) {

                $scope.model = {
                    email: '',
                    name: '',
                    lastName: '',
                    roleId: '5',
                    password: '',
                    passwordConf: '',
                    err: null,
                    roles: []
                };

                greyscaleRoleSrv.list()
                    .then(function (roles) {
                        $scope.model.roles = roles;
                    });

                $scope.cancel = function () {
                    $state.go('login');
                };

                $scope.register = function () {
                    $scope.model.err = null;
                    greyscaleUserSrv.register({
                        'email': $scope.model.email,
                        'password': $scope.model.password,
                        'firstName': $scope.model.name,
                        'lastName': $scope.model.lastName,
                        'roleID': $scope.model.roleId
                    })
                        .then($scope.cancel)
                        .catch(function (err) {
                            $log.debug(err);
                            if (err.data && err.data.message) {
                                $scope.model.err = err.data.message;
                            } else {
                                $scope.model.err = 'Register error.';
                            }
                        });
                };
            }
        };
    });
