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
            controller: function ($scope) {
                _init();

                $scope.remove = function (idx) {
                    $scope.model.splice(idx, 1);
                };

                $scope.addToggle = function(){
                    $scope.adding = (!$scope.adding && !$scope.options.readonly);
                };

                $scope.add = function () {
                    $scope.model.push($scope.newUrl);
                    _init();
                };

                function _init(){
                    $scope.adding = false;
                    $scope.newUrl='';
                }
            }
        };
    });
