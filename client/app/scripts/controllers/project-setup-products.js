'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupProductsCtrl', function ($scope, $state, $stateParams, greyscaleModalsSrv,
        greyscaleProjectApi, greyscaleProjectProductsTbl, Organization) {

        var products = greyscaleProjectProductsTbl;

        $scope.model = {};

        Organization.$watch('projectId', $scope, _renderProductsTable);

        function _renderProductsTable() {
            products.dataFilter.projectId = Organization.projectId;
            if ($scope.model.products) {
                products.tableParams.reload();
            } else {
                $scope.model.products = products;
            }
        }

    });
