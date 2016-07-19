/**
 * Created by dseytlin on 29.11.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:UoasCtrl
 * @description
 * # UoasCtrl
 * Controller (Unit of Analysis) of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('UoasListCtrl', function ($scope,
        greyscaleUoaTypesTbl,
        greyscaleUoasTbl,
        greyscaleUoaClassTypesTbl,
        greyscaleUoaTagsTbl,
        greyscaleUoaTagLinksTbl, Organization) {

        Organization.$watch($scope, _renderUoaTables);

        $scope.model = {
            uoas: greyscaleUoasTbl,
            uoaTypes: greyscaleUoaTypesTbl,
            uoaTags: greyscaleUoaTagsTbl,
            uoaTagLinks: greyscaleUoaTagLinksTbl,
            uoaClassTypes: greyscaleUoaClassTypesTbl
        };

        var stopUpdateUoaTypes = $scope.$on('update-uoaTypes', function (e, data) {
            $scope.model.uoas.update.uoaTypes(data.uoaTypes);
        });

        var stopUpdateUoaClassTypes = $scope.$on('update-uoaClassTypes', function (e, data) {
            $scope.model.uoaTags.update.uoaClassTypes(data.uoaClassTypes);
        });

        var stopUpdateUoaTags = $scope.$on('update-uoaTags', function (e, data) {
            $scope.model.uoaTagLinks.update.uoaTags(data.uoaTags);
        });

        var stopUpdateUoas = $scope.$on('update-uoas', function (e, data) {
            $scope.model.uoaTagLinks.update.uoas(data.uoas);
        });

        $scope.$on('$destroy', function () {
            stopUpdateUoaTypes();
            stopUpdateUoaClassTypes();
            stopUpdateUoaTags();
            stopUpdateUoas();
        });

        $scope.selectUoa = function (uoa) {
            if (typeof uoa !== 'undefined') {
                $scope.model.uoaTagLinks.query = {
                    uoaId: uoa.id
                };
                $scope.model.uoaTagLinks.tableParams.reload();
            }
            return $scope.model.uoas.current;
        };

        function _renderUoaTables() {
            _reloadTable($scope.model.uoas);
            _reloadTable($scope.model.uoaTypes);
            _reloadTable($scope.model.uoaTags);
            _reloadTable($scope.model.uoaTagLinks);
            _reloadTable($scope.model.uoaClassTypes);
        }

        function _reloadTable(table) {
            if (table && table.tableParams) {
                table.tableParams.reload();
            }
        }

    });
