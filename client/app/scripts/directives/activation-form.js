/**
 * Created by sbabushkin on 01.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('activateForm', function ($state, greyscaleUserApi, $log, inform) {
        return {
            templateUrl: 'views/directives/activation-form.html',
            restrict: 'AE',
            scope: {
                model: '=activateForm'
            },
            link: function (scope) {
                scope.activate = function () {
                    scope.model.err = null;

                    var data = {
                        'password': scope.model.password,
                        'firstName': scope.model.firstName,
                        'lastName': scope.model.lastName
                    };
                    greyscaleUserApi.activate(scope.model.activationToken, data)
                        .then(function () {
                            return greyscaleUserApi.login(scope.model.email, scope.model.password);
                        })
                        .then(function () {
                            $state.go('profile');
                        })
                        .catch(function (err) {
                            inform.add(err.data.message, {
                                type: 'danger'
                            });
                        });
                };
            }
        };
    });
