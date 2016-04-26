/**
 * Created by igi on 25.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsLinks', function () {
        return {
            restrict: 'E',
            scope: {
                model: '=?',
                options: '='
            },
            templateUrl: 'views/directives/gs-links.html',
            controller: function ($scope, greyscaleGlobals) {
                _init();

                $scope.remove = function (idx) {
                    $scope.model.splice(idx, 1);
                    _modifyEvt();
                };

                $scope.addToggle = function () {
                    $scope.adding = (!$scope.adding && !$scope.options.readonly);
                };

                $scope.add = function () {
                    if ($scope.model.indexOf($scope.newUrl) === -1) {
                        $scope.model.push($scope.newUrl);
                        _modifyEvt();
                        _init();
                    }
                };

                function _init() {
                    $scope.adding = false;
                    $scope.newUrl = '';
                }

                function _modifyEvt() {
                    $scope.$emit(greyscaleGlobals.events.survey.answerDirty);
                }
            }
        };
    });
