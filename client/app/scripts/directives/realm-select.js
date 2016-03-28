/**
 * Created by igi on 23.03.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('realmSelect', function (greyscaleRealmSrv) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/realm-select.html',
            controller: function ($scope) {
                var _model = {
                    realm: '',
                    realms: []
                };
                $scope.model = angular.extend($scope.model || {}, _model);

                $scope.update = function () {
                    greyscaleRealmSrv($scope.model.realm);
                };
            }
        };
    });
