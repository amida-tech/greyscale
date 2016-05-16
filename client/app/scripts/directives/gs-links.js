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
            controller: function ($scope, greyscaleGlobals, $element) {
                _init();

                $scope.formName = 'f_' + new Date().getTime();

                $scope.remove = function (idx) {
                    $scope.model.splice(idx, 1);
                    _modifyEvt();
                };

                $scope.urlChange = function () {
                    if ($scope.formName && $scope[$scope.formName].$$parentForm) {
                        $scope[$scope.formName].$$parentForm.$dirty = false;
                    }
                };

                $scope.addToggle = function () {
                    $scope.adding = (!$scope.adding && !$scope.options.readonly);
                    $scope.newUrl = '';
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
