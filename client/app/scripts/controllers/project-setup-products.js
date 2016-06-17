'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupProductsCtrl', function ($scope, greyscaleProjectProductsTbl, Organization) {

        var products = greyscaleProjectProductsTbl;

        $scope.model = {};

        Organization.$watch($scope, _renderProductsTable);

        function _renderProductsTable() {
            products.dataFilter.projectId = Organization.projectId;
            if ($scope.model.products) {
                products.tableParams.reload();
            } else {
                $scope.model.products = products;
            }
        }

    });
