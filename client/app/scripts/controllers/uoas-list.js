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
