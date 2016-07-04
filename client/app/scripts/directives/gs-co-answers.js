/**
 * Created by igi on 28.06.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsCoAnswers', function ($log) {
        return {
            restrict: 'AE',
            scope: {
                field: '='
            },
            templateUrl: 'views/directives/gs-co-answers.html',
            controller: function ($scope) {
                $scope.model = {
                    collapsed: true
                };
                $scope.getAuthor = _getName;

                function _getName(userId) {
                    return $scope.field.collaborators[userId] ? $scope.field.collaborators[userId].fullName : '';
                }
            }
        };
    });
