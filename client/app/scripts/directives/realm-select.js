/**
 * Created by igi on 23.03.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('realmSelect', function ($rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/realm-select.html',
            controller: function ($scope) {
                var _model = {realm: '', realms: []};
                $scope.model = angular.extend($scope.model || {}, _model);

                $scope.update = function () {
                    $rootScope.realm = $scope.model.realm;
                };
            }
        };
    });
